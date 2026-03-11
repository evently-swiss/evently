'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export function CopyLinkButton({ slug }: { slug: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        const url = `${window.location.origin}/s/${slug}`;
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <button
            onClick={handleCopy}
            className="text-gray-400 hover:text-white text-sm flex items-center gap-1 transition-colors"
            title="Copy Signup Link"
        >
            {copied ? (
                <>
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-green-500">Copied!</span>
                </>
            ) : (
                <>
                    <Copy className="h-4 w-4" />
                    <span>Copy URL</span>
                </>
            )}
        </button>
    );
}
