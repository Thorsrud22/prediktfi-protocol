
'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Idea {
    id: string;
    title: string;
    score: number;
    projectType: string;
    createdAt: string;
}

export default function IdeaHistory() {
    const { publicKey } = useWallet();
    const [ideas, setIdeas] = useState<Idea[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!publicKey) return;

        const fetchIdeas = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/idea/list?address=${publicKey.toBase58()}`);
                if (res.ok) {
                    const data = await res.json();
                    setIdeas(data.ideas);
                }
            } catch (error) {
                console.error('Failed to fetch ideas', error);
            } finally {
                setLoading(false);
            }
        };

        fetchIdeas();
    }, [publicKey]);

    if (!publicKey) {
        return (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200 shadow-sm mt-8">
                <p className="text-gray-500">Connect your wallet to see your saved ideas.</p>
            </div>
        );
    }

    if (loading) {
        return <div className="py-12 text-center text-gray-500">Loading your history...</div>;
    }

    if (ideas.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200 shadow-sm mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No ideas yet</h3>
                <p className="text-gray-500 mb-4">You haven't evaluated any ideas yet.</p>
                <Link href="/studio" className="text-blue-600 hover:text-blue-500 font-medium">
                    Start your first evaluation →
                </Link>
            </div>
        );
    }

    return (
        <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">My Validated Ideas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ideas.map((idea) => (
                    <Link key={idea.id} href={`/idea/${idea.id}`} className="block group">
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all hover:border-blue-300">
                            <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${idea.score >= 75 ? 'bg-green-100 text-green-700' :
                                            idea.score >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                        }`}>
                                        Score: {idea.score}
                                    </span>
                                    <span className="text-xs text-gray-500 uppercase">{idea.projectType}</span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 line-clamp-2">
                                    {idea.title}
                                </h3>
                                <div className="text-xs text-gray-400 mt-4">
                                    {new Date(idea.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
