/// Echo — MemoryRegistry
///
/// A tiny, user-owned on-chain pointer to a user's latest Walrus memory index
/// blob. This is what makes Echo's reflection memory *portable and verifiable*:
///
///   wallet address
///     -> MemoryPointer (this object, owned by the wallet)
///       -> latest Walrus index blob id
///         -> the saved reflection artifacts (Walrus blobs)
///
/// The pointer is created on the first commit and updated (overwritten + bumped)
/// on every later commit, each time signed by the user's wallet.
module echo::memory_registry {
    use std::string::String;

    /// A user-owned pointer to the latest Walrus memory index blob.
    public struct MemoryPointer has key, store {
        id: UID,
        /// Walrus blob id of the user's latest vector/memory index.
        index_blob_id: String,
        /// How many times the pointer has been updated (1 on create).
        updates: u64,
    }

    /// First commit: create the caller's pointer and transfer it to them.
    public fun create(index_blob_id: String, ctx: &mut TxContext) {
        let pointer = MemoryPointer {
            id: object::new(ctx),
            index_blob_id,
            updates: 1,
        };
        transfer::transfer(pointer, ctx.sender());
    }

    /// Later commits: point at the new latest index blob and bump the counter.
    public fun update(pointer: &mut MemoryPointer, index_blob_id: String) {
        pointer.index_blob_id = index_blob_id;
        pointer.updates = pointer.updates + 1;
    }

    /// Read accessor (handy for off-chain devInspect / tests).
    public fun index_blob_id(pointer: &MemoryPointer): String {
        pointer.index_blob_id
    }

    /// Number of updates so far.
    public fun updates(pointer: &MemoryPointer): u64 {
        pointer.updates
    }
}
