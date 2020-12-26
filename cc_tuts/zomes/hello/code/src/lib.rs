#![feature(proc_macro_hygiene)]

use hdk::prelude::*;
use hdk_proc_macros::zome;

#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct Post {
    message: String,
    timestamp: u64,
    author_id: Address,
}

#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct RegisteredUser {
    nickname: String,
    user_address: Address,
    timestamp: u64,
}

#[zome]
mod hello_zome {
    #[init]
    fn init() {
        Ok(())
    }

    #[validate_agent]
    pub fn validate_agent(validation_data: EntryValidationData<AgentId>) {
        Ok(())
    }

    #[zome_fn("hc_public")]
    pub fn hello_holo() -> ZomeApiResult<String> {
        Ok("Hello Holo".into())
    }

    #[zome_fn("hc_public")]
    pub fn register_me(nickname: String, timestamp: u64) -> ZomeApiResult<Address> {
        let registered_user = RegisteredUser {
            nickname,
            user_address: hdk::AGENT_ADDRESS.clone(),
            timestamp,
        };

        let registered_user_entry = Entry::App("registered_user".into(), registered_user.into());
        let registered_user_entry_address = hdk::commit_entry(&registered_user_entry)?;

        // Create the anchor entry and commit it to the chain.
        let anchor_entry = Entry::App("anchor".into(), "registered_user".into());
        let anchor_address = hdk::commit_entry(&anchor_entry)?;
        // Link the anchor to the game.
        hdk::link_entries(&anchor_address, &registered_user_entry_address, "has_registered_user", "")?;

        Ok(registered_user_entry_address)
    }

    #[zome_fn("hc_public")]
    pub fn create_post(message: String, timestamp: u64) -> ZomeApiResult<Address> {
        let post = Post {
            message,
            timestamp,
            author_id: hdk::AGENT_ADDRESS.clone(),
        };
        let agent_address = hdk::AGENT_ADDRESS.clone().into();
        let entry = Entry::App("post".into(), post.into());
        let address = hdk::commit_entry(&entry)?;
        hdk::link_entries(&agent_address, &address, "author_post", "")?;

        Ok(address)
    }

    #[zome_fn("hc_public")]
    pub fn retrieve_posts(agent_address: Address) -> ZomeApiResult<Vec<Post>> {
        hdk::utils::get_links_and_load_type(
            &agent_address,
            LinkMatch::Exactly("author_post"),
            LinkMatch::Any,
        )
    }

    #[zome_fn("hc_public")]
    pub fn retrieve_users() -> ZomeApiResult<Vec<RegisteredUser>> {
        let anchor_entry = Entry::App("anchor".into(), "registered_user".into());
        let anchor_address = hdk::commit_entry(&anchor_entry)?;
        // Now search for all links from the anchors address
        // that are called `has_game`.
        // This call also loads the `Entry` into the `Game` type.
        hdk::utils::get_links_and_load_type(
            &anchor_address,
            // Match the link_type exactly has_game.
            LinkMatch::Exactly("has_registered_user"),
            // Match any tag.
            LinkMatch::Any,
        )
    }

    #[zome_fn("hc_public")]
    pub fn get_agent_id() -> ZomeApiResult<Address> {
        Ok(hdk::AGENT_ADDRESS.clone())
    }

    #[zome_fn("hc_public")]
    pub fn get_dna_hash() -> ZomeApiResult<Address> {
        Ok(hdk::DNA_ADDRESS.clone())
    }

    #[zome_fn("hc_public")]
    pub fn get_agent() -> ZomeApiResult<String> {
        Ok(hdk::AGENT_ID_STR.to_string().clone())
    }

    #[entry_def]
    fn anchor_entry_def() -> ValidatingEntryType {
        entry!(
            name: "anchor",
            description: "Anchor to all the links",
            sharing: Sharing::Public,
            validation_package: || {
                hdk::ValidationPackageDefinition::Entry
            },
            validation: |_validation_data: hdk::EntryValidationData<String>| {
                Ok(())
            },
            // Anchor will link to all games.
            // It is a good way for players to
            // find which games are available.
            links: [
            to!(
                // Link to the game entry
                "registered_user",
                // This link is a has_game link
                link_type: "has_registered_user",
               validation_package: || {
                   hdk::ValidationPackageDefinition::Entry
               },
               validation: |_validation_data: hdk::LinkValidationData| {
                   Ok(())
               }
            )
            ]
        )
    }

    #[entry_def]
    fn post_entry_def() -> ValidatingEntryType {
        entry!(
            name: "post",
            description: "A blog post",
            sharing: Sharing::Public,
            validation_package: || {
                hdk::ValidationPackageDefinition::Entry
            },
            validation: | validation_data: hdk::EntryValidationData<Post>| {
                match validation_data {
                    hdk::EntryValidationData::Create{ entry, .. } => {
                        const MAX_LENGTH: usize = 140;
                        if entry.message.len() <= MAX_LENGTH {
                           Ok(())
                        } else {
                           Err("Post too long".into())
                        }
                    },
                    _ => Ok(()),
                }
            },
            links: [
                from!(
                   "%agent_id",
                   link_type: "author_post",
                   validation_package: || {
                       hdk::ValidationPackageDefinition::Entry
                   },
                   validation: |_validation_data: hdk::LinkValidationData| {
                       Ok(())
                   }
                )
            ]
        )
    }

    #[entry_def]
    fn registered_user_entry_def() -> ValidatingEntryType {
        entry!(
            name: "registered_user",
            description: "A user registered to Facebook",
            sharing: Sharing::Public,
            validation_package: || {
                hdk::ValidationPackageDefinition::Entry
            },
            validation: | validation_data: hdk::EntryValidationData<RegisteredUser>| {
                match validation_data {
                    hdk::EntryValidationData::Create{ entry, .. } => {
                        const MAX_LENGTH: usize = 140;
                        if entry.nickname.len() <= MAX_LENGTH {
                           Ok(())
                        } else {
                           Err("Nickname too long".into())
                        }
                    },
                    _ => Ok(()),
                }
            },
            links: [
                from!(
                   "%agent_id",
                   link_type: "registered_user",
                   validation_package: || {
                       hdk::ValidationPackageDefinition::Entry
                   },
                   validation: |_validation_data: hdk::LinkValidationData| {
                       Ok(())
                   }
                )
            ]
        )
    }
}
