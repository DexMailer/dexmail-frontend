# UI Integration with Services

I have connected the UI components to the refactored services (`mailService`, `claimService`).

## Changes

### 1. Mail Composition (`src/components/mail/compose-dialog.tsx`)
*   Updated `ComposeDialog` to use `mailService.sendEmail`.
*   Added logic to map UI assets to `CryptoAsset` type.
*   Added loading state and error handling.

### 2. Mail Inbox (`src/components/mail/mail.tsx`)
*   Updated `MailComponent` to fetch emails using `mailService.getInbox` when the user is connected.
*   Mapped fetched `EmailMessage` data to the `Mail` type expected by the UI.
*   Added `hasCryptoTransfer` field to `Mail` type in `src/lib/data.ts`.

### 3. Mail Display (`src/components/mail/mail-display.tsx`)
*   Added a "Claim Assets" button if the email has `hasCryptoTransfer: true`.
*   Links to `/dashboard/claim`.

### 4. Claim Page (`src/app/dashboard/claim/page.tsx`)
*   Updated `ClaimPage` to use `claimService`.
*   **Step 1**: Verifies claim token using `claimService.verifyClaimToken`.
*   **Step 3**: Deploys wallet using `claimService.deployAndClaim`.
*   Added "Connect Wallet" and "Create Password" (generates random wallet) options for deployment.

## Testing

1.  **Send Email**:
    *   Open "Write Message".
    *   Fill details.
    *   (Optional) Attach Crypto.
    *   Click Send.
    *   Check console for success/error (and network tab for IPFS/Contract calls).

2.  **Inbox**:
    *   Connect Wallet.
    *   Inbox should load emails from the blockchain (if any).

3.  **Claim**:
    *   Go to `/dashboard/claim`.
    *   Enter a token (mock: any string).
    *   Follow steps to deploy wallet.
