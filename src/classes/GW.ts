import { NS } from "@ns"
import { BATCHDELAY, GROWTHAMOUNT, SCRIPTS } from "lib/constants"
import { deployScript, getAdminServers, killPids, waitPids } from "lib/utils"

export class GW implements Batch {
	private ns: NS
	readonly target: string
	readonly id: string
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private growAmount: number
	readonly threads: number[]
	private times: number[]
	private delays: number[]
	private ends: number[]
	private pids: number[]


	constructor(ns: NS, target: string, id: string, growAmount = GROWTHAMOUNT) {
		this.ns = ns
		this.target = target
		this.id = id
		this.growAmount = growAmount
		this.threads = this.calcBatchThreads()
		this.times = this.calcBatchTimes()
		this.delays = this.calcBatchDelays()
		this.ends = this.calcBatchEndTimes()
		this.pids = []
	}

	public isDeployed(): boolean {
		if (this.pids.some((p) => this.ns.isRunning(p))) return true
		this.pids = []
		return false
	}
	public deploy(): boolean {
		if(this.isDeployed()) return true
		const servers = getAdminServers(this.ns)
		this.pids.push(...deployScript(this.ns,
			SCRIPTS.GROW,
			this.threads[0],
			servers,
			this.target,
			`${this.delays[0]}`,
			this.id))
		this.pids.push(...deployScript(this.ns,
			SCRIPTS.WEAKEN,
			this.threads[1],
			servers,
			this.target,
			`${this.delays[1]}`,
			this.id))
		if (this.isDeployed()) {
			this.ns.print(`SUCCESS ${this.id}: Deployed!`)
			return true
		}
		else {
			this.ns.print(`FAIL ${this.id}: Can't Deploy!`)
			return false
		}
	}

	public kill(): void {
		let message = `WARN Killed all scripts started by Batch:${this.id}`
		if (!this.pids.length) {
			message = `ERROR No scripts to kill in Batch:${this.id}`
		}
		killPids(this.ns, this.pids)
		this.ns.print(message)
	}

	public log(): void {
		this.ns.print(`INFO Threads... ${this.threads}`)
		this.ns.print(`INFO Delays.... ${this.delays}`)
		this.ns.print(`INFO Times..... ${this.times}`)
		this.ns.print(`INFO Ends...... ${this.ends}`)
	}
	public async wait(): Promise<void> {
		await waitPids(this.ns, this.pids)
		this.pids = []
	}
	public get totalThreads(): number {
		return this.threads.reduce((acc, b) => acc + b, 0)
	}

	/**Calcuates duration of each batch step*/
	private calcBatchTimes(): number[] {
		const times = [0, 0]
		times[0] = Math.ceil(this.ns.getGrowTime(this.target))
		times[1] = Math.ceil(this.ns.getWeakenTime(this.target))
		return times
	}
	/**Calculate Delayed Starts for Batch*/
	private calcBatchDelays(): number[] {
		const delays = [0, 0]
		const maxTime = Math.max(...this.times)
		delays[0] = maxTime - this.times[0]
		delays[1] = maxTime - this.times[1] + BATCHDELAY
		return delays
	}
	/**Calculates ending times of batch*/
	private calcBatchEndTimes(): number[] {
		return this.times.map((time, idx) => time + this.delays[idx])
	}

	/**Returns the number of threads required for a batch*/
	private calcBatchThreads(): number[] {
		const threads = []
		threads[0] = Math.ceil(this.ns.growthAnalyze(this.target, this.growAmount))
		threads[1] = Math.ceil(this.ns.growthAnalyzeSecurity(threads[0]) / 0.05)
		return threads
	}

}