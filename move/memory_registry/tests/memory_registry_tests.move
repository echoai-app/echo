#[test_only]
module echo::memory_registry_tests {
    use std::string;
    use sui::test_scenario;
    use echo::memory_registry::{Self, MemoryPointer};

    const USER: address = @0xA11CE;

    #[test]
    fun create_transfers_pointer_to_caller_with_first_index() {
        let mut scenario = test_scenario::begin(USER);
        {
            memory_registry::create(string::utf8(b"walrus-index-blob-1"), test_scenario::ctx(&mut scenario));
        };
        test_scenario::next_tx(&mut scenario, USER);
        {
            let pointer = test_scenario::take_from_sender<MemoryPointer>(&scenario);
            assert!(memory_registry::index_blob_id(&pointer) == string::utf8(b"walrus-index-blob-1"), 0);
            assert!(memory_registry::updates(&pointer) == 1, 1);
            test_scenario::return_to_sender(&scenario, pointer);
        };
        test_scenario::end(scenario);
    }

    #[test]
    fun update_repoints_to_latest_index_and_bumps_counter() {
        let mut scenario = test_scenario::begin(USER);
        {
            memory_registry::create(string::utf8(b"index-v1"), test_scenario::ctx(&mut scenario));
        };
        test_scenario::next_tx(&mut scenario, USER);
        {
            let mut pointer = test_scenario::take_from_sender<MemoryPointer>(&scenario);
            memory_registry::update(&mut pointer, string::utf8(b"index-v2"));
            memory_registry::update(&mut pointer, string::utf8(b"index-v3"));
            assert!(memory_registry::index_blob_id(&pointer) == string::utf8(b"index-v3"), 0);
            assert!(memory_registry::updates(&pointer) == 3, 1);
            test_scenario::return_to_sender(&scenario, pointer);
        };
        test_scenario::end(scenario);
    }
}
