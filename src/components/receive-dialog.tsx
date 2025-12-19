import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";

interface ReceiveDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    address: string | undefined;
}

export function ReceiveDialog({ open, onOpenChange, address }: ReceiveDialogProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (address) {
            navigator.clipboard.writeText(address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!address) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Receive Assets</DialogTitle>
                    <DialogDescription>
                        Scan the QR code or copy the address below to receive funds.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center space-y-6 py-4">
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-primary/50 rounded-2xl opacity-75 blur-sm group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                        <div className="relative rounded-xl border bg-white p-4 shadow-xl">
                            <QRCodeSVG
                                value={address}
                                size={200}
                                level="H"
                                marginSize={0}
                                fgColor="currentColor"
                                className="text-primary"
                                imageSettings={{
                                    src: "/logo.png",
                                    x: undefined,
                                    y: undefined,
                                    height: 48,
                                    width: 48,
                                    excavate: true,
                                }}
                            />
                        </div>
                    </div>
                    <div className="flex w-full items-center space-x-2">
                        <div className="grid flex-1 gap-2">
                            <div className="rounded-md border bg-muted px-3 py-2 text-xs font-mono text-center text-muted-foreground truncate">
                                {address}
                            </div>
                        </div>
                        <Button size="icon" className="shrink-0" onClick={handleCopy}>
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
