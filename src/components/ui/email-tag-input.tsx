'use client';

import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mailService } from '@/lib/mail-service';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface EmailTagInputProps {
    emails: string[];
    onChange: (emails: string[]) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

interface EmailValidation {
    email: string;
    isValid: boolean;
    reason?: string;
    isValidating: boolean;
}

const isValidEmailFormat = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export function EmailTagInput({
    emails,
    onChange,
    placeholder = 'Enter email addresses...',
    disabled = false,
    className
}: EmailTagInputProps) {
    const [inputValue, setInputValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [validations, setValidations] = useState<Record<string, EmailValidation>>({});
    const inputRef = useRef<HTMLInputElement>(null);

    // Validate email addresses
    useEffect(() => {
        emails.forEach(async (email) => {
            if (validations[email]) return; // Already validated or validating

            // Set validating state
            setValidations(prev => ({
                ...prev,
                [email]: { email, isValid: true, isValidating: true }
            }));

            // Validate
            const result = await mailService.validateEmail(email);
            setValidations(prev => ({
                ...prev,
                [email]: {
                    email,
                    isValid: result.isValid,
                    reason: result.reason,
                    isValidating: false
                }
            }));
        });
    }, [emails]);

    const addEmail = (email: string) => {
        const trimmedEmail = email.trim();
        if (!trimmedEmail) return;

        const normalizedEmail = trimmedEmail;

        // Prevent duplicates
        if (emails.includes(normalizedEmail)) {
            setInputValue('');
            return;
        }

        onChange([...emails, normalizedEmail]);
        setInputValue('');
    };

    const removeEmail = (indexToRemove: number) => {
        const emailToRemove = emails[indexToRemove];
        onChange(emails.filter((_, index) => index !== indexToRemove));

        // Clean up validation state
        setValidations(prev => {
            const newValidations = { ...prev };
            delete newValidations[emailToRemove];
            return newValidations;
        });
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        // Create tag on Enter, comma, or space
        if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
            e.preventDefault();
            addEmail(inputValue);
        }
        // Remove last tag on Backspace when input is empty
        else if (e.key === 'Backspace' && !inputValue && emails.length > 0) {
            removeEmail(emails.length - 1);
        }
    };

    const handleBlur = () => {
        setIsFocused(false);
        // Add email on blur if there's text
        if (inputValue.trim()) {
            addEmail(inputValue);
        }
    };

    const handleContainerClick = () => {
        inputRef.current?.focus();
    };

    return (
        <div
            className={cn(
                'flex min-h-[40px] w-full flex-wrap gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-text',
                isFocused && 'ring-2 ring-ring ring-offset-2',
                disabled && 'cursor-not-allowed opacity-50',
                className
            )}
            onClick={handleContainerClick}
        >
            <TooltipProvider delayDuration={300}>
                {emails.map((email, index) => {
                    const validation = validations[email];
                    const isValidating = validation?.isValidating ?? false;
                    const isValid = validation?.isValid ?? isValidEmailFormat(email);
                    const reason = validation?.reason;

                    const badge = (
                        <Badge
                            key={index}
                            variant={isValid ? 'default' : 'destructive'}
                            className="gap-1 pr-1 pl-2 py-1"
                        >
                            {isValidating && <Loader2 className="h-3 w-3 animate-spin" />}
                            <span className="text-xs">{email}</span>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeEmail(index);
                                }}
                                disabled={disabled}
                                className="ml-1 rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            >
                                <X className="h-3 w-3" />
                                <span className="sr-only">Remove {email}</span>
                            </button>
                        </Badge>
                    );

                    if (!isValid && reason) {
                        return (
                            <Tooltip key={index}>
                                <TooltipTrigger asChild>
                                    {badge}
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{reason}</p>
                                </TooltipContent>
                            </Tooltip>
                        );
                    }

                    return badge;
                })}
            </TooltipProvider>
            <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={handleBlur}
                disabled={disabled}
                placeholder={emails.length === 0 ? placeholder : ''}
                className="flex-1 min-w-[120px] bg-transparent outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
            />
        </div>
    );
}
