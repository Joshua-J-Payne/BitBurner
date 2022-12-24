import { NS } from "@ns";

/** @param {NS} ns */
export async function main(ns: NS) {
	const target: string = ns.args[0].toString()
	const sleep: number = +ns.args[1]
	if (sleep) await (ns.sleep(sleep))
	await ns.hack(target)
}