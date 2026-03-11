export type ActionState = {
    message?: string;
    errors?: {
        [key: string]: string[];
    };
    success?: boolean;
} | null;
