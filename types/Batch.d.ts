declare interface Batch {
	target: string
	id: string
	isDeployed(): boolean
	log(): void
	deploy(): void
	kill(): void
	wait(): void
}
