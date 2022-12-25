declare interface Batch {
	target: string
	threads: number[]
	id: string
	isDeployed(): boolean
	log(): void
	deploy(): void
	kill(): void
	wait(): void
}
