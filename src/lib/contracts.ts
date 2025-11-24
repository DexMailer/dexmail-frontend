import { baseMailerAbi } from '../../contracts/abi';

// TODO: Replace with deployed contract address
export const BASEMAILER_ADDRESS = process.env.NEXT_PUBLIC_BASEMAILER_ADDRESS as `0x${string}` || '0x0000000000000000000000000000000000000000';

export { baseMailerAbi };
