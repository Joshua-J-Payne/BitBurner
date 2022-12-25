import { findAdminServers, deployScript, killPids, waitPids } from "lib/utils"
import { NS } from "@ns"
import { BATCHDELAY, SCRIPTS } from "lib/constants"


export class HWGW implements Batch {
	private ns: NS
	readonly target: string
	readonly id: string
	private hackAmount: number
	readonly threads: number[]
	private times: number[]
	private delays: number[]
	private ends: number[]
	private pids: number[]


	constructor(ns: NS, target: string, id: string, hackAmount: number) {
		this.ns = ns
		this.target = target
		this.id = id
		this.hackAmount = hackAmount
		this.threads = this.calcBatchThreads()
		this.times = this.calcBatchTimes()
		this.delays = this.calcBatchDelays()
		this.ends = this.calcBatchEndTimes()
		this.pids = []
	}

	public isDeployed(): boolean {
		if (this.pids.some(p => this.ns.isRunning(p))) return true
		this.pids = []
		return false
	}

	public deploy(): boolean {
		const servers = findAdminServers(this.ns)
		//Hack
		this.pids.push(...deployScript(
			this.ns,
			SCRIPTS.HACK,
			this.threads[0],
			servers,
			this.target,
			`${this.delays[0]}`,
			this.id))
		//Weaken
		this.pids.push(...deployScript(
			this.ns,
			SCRIPTS.WEAKEN,
			this.threads[1],
			servers,
			this.target,
			`${this.delays[1]}`,
			this.id))
		//Grow
		this.pids.push(...deployScript(
			this.ns,
			SCRIPTS.GROW,
			this.threads[2],
			servers,
			this.target,
			`${this.delays[2]}`,
			this.id))
		//Weaken
		this.pids.push(...deployScript(
			this.ns,
			SCRIPTS.WEAKEN,
			this.threads[3],
			servers,
			this.target,
			`${this.delays[3]}`,
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
		killPids(this.ns, this.pids)
	}

	public log(): void {
		this.ns.print(`INFO Threads... ${this.threads}`)
		this.ns.print(`INFO Delays.... ${this.delays}`)
		this.ns.print(`INFO Times..... ${this.times}`)
		this.ns.print(`INFO Ends...... ${this.ends}`)
	}
	public async wait() {
		await waitPids(this.ns, this.pids)
		this.pids = []
	}
	public get totalThreads() {
		return this.threads.reduce((acc, b) => acc + b, 0)
	}

	/**Calcuates duration of each batch step*/
	private calcBatchTimes(): number[] {
		const times = [0, 0, 0, 0]
		times[0] = Math.ceil(this.ns.getHackTime(this.target))
		times[1] = Math.ceil(this.ns.getWeakenTime(this.target))
		times[2] = Math.ceil(this.ns.getGrowTime(this.target))
		times[3] = Math.ceil(this.ns.getWeakenTime(this.target))
		return times
	}
	/**Calculate Dleayed Starts for Batch*/
	private calcBatchDelays(): number[] {
		const delays = [0, 0, 0, 0]
		const maxTime = Math.max(...this.times)
		delays[0] = maxTime - this.times[0]
		delays[1] = maxTime - this.times[1] + BATCHDELAY
		delays[2] = maxTime - this.times[2] + 2 * BATCHDELAY
		delays[3] = maxTime - this.times[3] + 3 * BATCHDELAY
		return delays
	}
	/**Calculates necessary delays to make batch end simultaneously */
	private calcBatchEndTimes(): number[] {
		return this.times.map((time, idx) => time + this.delays[idx])
	}

	/**Returns the number of threads required for a batch*/
	private calcBatchThreads(): number[] {
		const threads = [0, 0, 0, 0]
		const growAmount = Math.ceil(1 / (1 - this.hackAmount))
		const value = this.hackAmount * this.ns.getServerMaxMoney(this.target)
		threads[0] = Math.ceil(this.ns.hackAnalyzeThreads(this.target, value)) //hack
		threads[1] = Math.ceil(this.ns.hackAnalyzeSecurity(threads[0], this.target) / 0.05) //weak
		threads[2] = Math.ceil(this.ns.growthAnalyze(this.target, growAmount)) //grow
		threads[3] = Math.ceil(this.ns.growthAnalyzeSecurity(threads[2]) / 0.05) //weak

		return threads
	}

}