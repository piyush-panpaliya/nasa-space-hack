/**
* This file was @generated using pocketbase-typegen
*/

import type PocketBase from 'pocketbase'
import type { RecordService } from 'pocketbase'

export enum Collections {
	Queues = "queues",
	Users = "users",
}

// Alias types for improved usability
export type IsoDateString = string
export type RecordIdString = string
export type HTMLString = string

// System fields
export type BaseSystemFields<T = never> = {
	id: RecordIdString
	created: IsoDateString
	updated: IsoDateString
	collectionId: string
	collectionName: Collections
	expand?: T
}

export type AuthSystemFields<T = never> = {
	email: string
	emailVisibility: boolean
	username: string
	verified: boolean
} & BaseSystemFields<T>

// Record types for each collection

export enum QueuesStatusOptions {
	"queued" = "queued",
	"processing" = "processing",
	"done" = "done",
}
export type QueuesRecord = {
	fire?: number
	health?: number
	lat?: number
	long?: number
	status?: QueuesStatusOptions
	user?: RecordIdString
	water?: number
}

export type UsersRecord = {
	avatar?: string
	name?: string
}

// Response types include system fields and match responses from the PocketBase API
export type QueuesResponse<Texpand = unknown> = Required<QueuesRecord> & BaseSystemFields<Texpand>
export type UsersResponse<Texpand = unknown> = Required<UsersRecord> & AuthSystemFields<Texpand>

// Types containing all Records and Responses, useful for creating typing helper functions

export type CollectionRecords = {
	queues: QueuesRecord
	users: UsersRecord
}

export type CollectionResponses = {
	queues: QueuesResponse
	users: UsersResponse
}

// Type for usage with type asserted PocketBase instance
// https://github.com/pocketbase/js-sdk#specify-typescript-definitions

export type TypedPocketBase = PocketBase & {
	collection(idOrName: 'queues'): RecordService<QueuesResponse>
	collection(idOrName: 'users'): RecordService<UsersResponse>
}
