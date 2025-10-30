declare module '@coral-xyz/anchor' {
	export function setProvider(provider: any): void;
	export const workspace: any;
	export const AnchorProvider: {
		env: () => any;
	};
	export namespace web3 {
		export const SystemProgram: any;
		export const Keypair: any;
	}
	export type Program<T = any> = any;
}
