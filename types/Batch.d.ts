declare interface Batch {
	target: string
	id: string
	/**Checks if Batch has any running pids */
	isDeployed(): boolean
	/**prints Batch calculations to log */
	log(): void
	/**Starts all the batch scripts, true if successful */
	deploy(): boolean
	/**kills any pids started by batch */
	kill(): void
	/**waits on batch pids to stop running */
	wait(): void
}
