#![feature(proc_macro_hygiene)]

use hdk::prelude::*;
use hdk_proc_macros::zome;

#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct Post {
    text: String,
    post_type: String,
    timestamp: u64,
    author_address: Address,
    author_nickname: String,
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
    pub fn register_me(nickname: String, timestamp: u64) -> ZomeApiResult<Address> {
        let registered_user = RegisteredUser {
            nickname,
            user_address: hdk::AGENT_ADDRESS.clone(),
            timestamp,
        };

        let registered_user_entry = Entry::App("registered_user".into(), registered_user.into());
        let registered_user_entry_address = hdk::commit_entry(&registered_user_entry)?;

        let anchor_entry = Entry::App("anchor_registered_user".into(), "registered_user".into());
        let anchor_address = hdk::commit_entry(&anchor_entry)?;

        hdk::link_entries(&anchor_address, &registered_user_entry_address, "has_registered_user", "")?;

        Ok(registered_user_entry_address)
    }

    #[zome_fn("hc_public")]
    pub fn create_public_post(text: String, timestamp: u64, author_nickname: String) -> ZomeApiResult<Address> {
        let post_type = "public".to_string();
        let post = Post {
            text,
            post_type,
            timestamp,
            author_address: hdk::AGENT_ADDRESS.clone(),
            author_nickname
        };

        let post_entry = Entry::App("public_post".into(), post.into());
        let post_address = hdk::commit_entry(&post_entry)?;

        let anchor_entry = Entry::App("anchor_public_post".into(), "public_post".into());
        let anchor_address = hdk::commit_entry(&anchor_entry)?;

        hdk::link_entries(&anchor_address, &post_address, "has_public_post", "")?;

        Ok(post_address)
    }

    #[zome_fn("hc_public")]
    pub fn create_private_post(text: String, timestamp: u64, author_nickname: String) -> ZomeApiResult<Address> {
        let post_type = "private".to_string();
        let post = Post {
            text,
            post_type,
            timestamp,
            author_address: hdk::AGENT_ADDRESS.clone(),
            author_nickname
        };

        let post_entry = Entry::App("private_post".into(), post.into());
        let post_address = hdk::commit_entry(&post_entry)?;

        let agent_address = hdk::AGENT_ADDRESS.clone().into();

        hdk::link_entries(&agent_address, &post_address, "private_post", "")?;

        Ok(post_address)
    }

    #[zome_fn("hc_public")]
    pub fn retrieve_public_posts() -> ZomeApiResult<Vec<Post>> {
        let anchor_entry = Entry::App("anchor_public_post".into(), "public_post".into());
        let anchor_address = hdk::commit_entry(&anchor_entry)?;

        hdk::utils::get_links_and_load_type(
            &anchor_address,
            LinkMatch::Exactly("has_public_post"),
            LinkMatch::Any,
        )
    }

    #[zome_fn("hc_public")]
    pub fn retrieve_private_posts(agent_address: Address) -> ZomeApiResult<Vec<Post>> {
        hdk::utils::get_links_and_load_type(
            &agent_address,
            LinkMatch::Exactly("private_post"),
            LinkMatch::Any,
        )
    }

    #[zome_fn("hc_public")]
    pub fn retrieve_users() -> ZomeApiResult<Vec<RegisteredUser>> {
        let anchor_entry = Entry::App("anchor_registered_user".into(), "registered_user".into());
        let anchor_address = hdk::commit_entry(&anchor_entry)?;

        hdk::utils::get_links_and_load_type(
            &anchor_address,
            LinkMatch::Exactly("has_registered_user"),
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
    pub fn get_agent_nickname() -> ZomeApiResult<String> {
        Ok(hdk::AGENT_ID_STR.to_string().clone())
    }

    #[entry_def]
    fn anchor_registered_user_entry_def() -> ValidatingEntryType {
        entry!(
            name: "anchor_registered_user",
            description: "Anchor to all Holobook registered users",
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
    fn anchor_public_post_entry_def() -> ValidatingEntryType {
        entry!(
            name: "anchor_public_post",
            description: "Anchor to all Holobook public posts",
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
                "public_post",
                // This link is a has_game link
                link_type: "has_public_post",
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
    fn public_post_entry_def() -> ValidatingEntryType {
        entry!(
            name: "public_post",
            description: "A Holobook public post",
            sharing: Sharing::Public,
            validation_package: || {
                hdk::ValidationPackageDefinition::Entry
            },
            validation: | validation_data: hdk::EntryValidationData<Post>| {
                match validation_data {
                    hdk::EntryValidationData::Create{ entry, .. } => {
                        const MAX_LENGTH: usize = 140;
                        if entry.text.len() <= MAX_LENGTH {
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
                   link_type: "public_post",
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
    fn private_post_entry_def() -> ValidatingEntryType {
        entry!(
            name: "private_post",
            description: "A Holobook private post",
            sharing: Sharing::Private,
            validation_package: || {
                hdk::ValidationPackageDefinition::Entry
            },
            validation: | validation_data: hdk::EntryValidationData<Post>| {
                match validation_data {
                    hdk::EntryValidationData::Create{ entry, .. } => {
                        const MAX_LENGTH: usize = 140;
                        if entry.text.len() <= MAX_LENGTH {
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
                   link_type: "private_post",
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
            description: "A Holobook user registered",
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
