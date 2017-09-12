
# Data Model

## Message:
- messageId (numeric)
- ts
- type
- sourceId
- payload

# Redis naming conventions

## Messages

Only the last 100k messages are stored

`my-apis:<env>:messages` => ZSET of <ts> <-> <messageId>
`my-apis:<env>:messages:<messageId>` => HASH
`my-apis:<env>:auto:messages` => counter of the latest event id

**Additional Indexes**
`my-apis:<env>:messages:sources:<sourceId>` => ZSET of <ts> <-> <messageId>
`my-apis:<env>:messages:types:<messageType>` => ZSET of <ts> <-> <messageId>