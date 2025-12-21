import type { Abi } from 'viem';
import baseMailerJson from './basemailer.json';
export const baseMailerAbi: Abi = baseMailerJson as Abi;

export type BaseMailerAbi = typeof baseMailerAbi;
export type BaseMailerEventName =
  | 'CryptoSent'
  | 'EmailRegistered'
  | 'MailSent'
  | 'OwnershipTransferred'
  | 'Paused'
  | 'RelayerAuthorized'
  | 'TransferCooldownUpdated'
  | 'Unpaused'
  | 'WalletClaimed'
  | 'WalletCreated';

export default {
  baseMailerAbi,
};
