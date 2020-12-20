#![feature(proc_macro_hygiene)]

use hdk::prelude::*;
use hdk_proc_macros::zome;
use std::time::{SystemTime, UNIX_EPOCH};

// see https://developer.holochain.org/api/0.0.51-alpha1/hdk/ for info on using the hdk library

// This is a sample zome that defines an entry type "MyEntry" that can be committed to the
// agent's chain via the exposed function create_my_entry

#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct Post {
    message: String,
    timestamp: u64,
    author_id: Address,
}

#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
pub struct RegisteredUser {
    nickname: String,
    user_address: String,
    timestamp: u64,
}

#[zome]
mod hello_zome {

    #[init]
    fn init() {
        let dna_hash = hdk::DNA_ADDRESS.clone().into();

        let start = SystemTime::now();
        let since_the_epoch = start
            .duration_since(UNIX_EPOCH)
            .expect("Time went backwards");
        let timestamp = since_the_epoch.as_secs() * 1000 +
            since_the_epoch.subsec_nanos() as u64 / 1_000_000;

        let registered_user = RegisteredUser {
            nickname: hdk::AGENT_ID_STR.clone().into(),
            user_address: hdk::AGENT_ADDRESS.clone().into(),
            timestamp
        };

        let entry = Entry::App("regitered_user".into(), registered_user.into());
        let address = hdk::commit_entry(&entry)?;

        hdk::link_entries(&dna_hash, &address, "registered_user", "")?;

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
    pub fn retrieve_users() -> ZomeApiResult<Vec<Post>> {
        let dna_hash = hdk::DNA_ADDRESS.clone().into();

        hdk::utils::get_links_and_load_type(
            &dna_hash,
            LinkMatch::Exactly("registered_user"),
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

    #[entry_def]
    fn post_entry_def() -> ValidatingEntryType {
        entry!(
            name: "post",
            description: "A blog post",
            sharing: Sharing::Private,
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
}
