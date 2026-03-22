import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { EditUserForm } from './edit-form';

async function getUser(id: string) {
    const user = await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
        },
    });

    if (!user) notFound();

    return user;
}

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const user = await getUser(id);

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">Edit User</h2>
            <EditUserForm user={user} />
        </div>
    );
}
