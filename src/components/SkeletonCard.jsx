import React from 'react';

export const SkeletonCard = () => {
    return (
        <div className="relative overflow-hidden rounded-[40px] shadow-sm flex flex-col h-[480px] bg-white border border-slate-100 animate-pulse">
            {/* Imagen Placeholder */}
            <div className="relative h-2/5 bg-slate-200 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]"></div>
            </div>

            {/* Contenido Placeholder */}
            <div className="p-8 flex-grow flex flex-col justify-between">
                <div className="space-y-4">
                    <div className="h-4 bg-slate-200 rounded-full w-3/4"></div>
                    <div className="h-3 bg-slate-100 rounded-full w-1/2"></div>
                </div>

                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-3xl">
                        <div className="h-4 bg-slate-200 rounded-full w-1/4"></div>
                        <div className="h-4 bg-slate-200 rounded-full w-1/4"></div>
                        <div className="h-4 bg-slate-200 rounded-full w-1/4"></div>
                    </div>

                    <div className="h-10 bg-slate-200 rounded-3xl w-full"></div>
                </div>
            </div>
        </div>
    );
};
