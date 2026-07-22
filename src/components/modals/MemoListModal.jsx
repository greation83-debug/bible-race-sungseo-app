import React from 'react';
import Icon from '../Icon';
import { countMemoEntries, sortMemoEntriesNewestFirst } from '../../utils/memoUtils';

const MemoListModal = ({
    show,
    onClose,
    memos,
    currentDay,
    score,
    streak,
    currentUser,
    generateMemosHTML
}) => {
    if (!show) return null;
    const memoEntries = sortMemoEntriesNewestFirst(memos);
    const memoCount = countMemoEntries(memos);

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
        }}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h3 className="text-xl font-bold text-slate-800">📝 나의 묵상 기록</h3>
                    <button onClick={onClose} className="text-slate-400"><Icon name="close" /></button>
                </div>
                <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 mb-4">
                    <div className="flex justify-between items-center">
                        <div className="text-center flex-1">
                            <p className="text-2xl font-bold text-indigo-600">{memoCount}</p>
                            <p className="text-[10px] text-slate-500">작성한 묵상</p>
                        </div>
                        <div className="text-center flex-1 border-l border-indigo-200">
                            <p className="text-2xl font-bold text-indigo-600">{currentDay || 1}</p>
                            <p className="text-[10px] text-slate-500">현재 Day</p>
                        </div>
                        <div className="text-center flex-1 border-l border-indigo-200">
                            <p className="text-2xl font-bold text-indigo-600">{score || 0}</p>
                            <p className="text-[10px] text-slate-500">총 점수</p>
                        </div>
                    </div>
                </div>
                <div className="space-y-3 overflow-y-auto max-h-[45vh]">
                    {memoEntries.length > 0 ? (
                        memoEntries.map(memo => {
                            return (
                                <div key={memo.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-blue-600">{memo.readCount ? `${memo.readCount}독 · ` : ''}DAY {memo.day}</span>
                                        <span className="text-[10px] text-slate-400">{new Date(memo.date).toLocaleDateString('ko-KR')}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-1">{memo.title}</p>
                                    <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{memo.text}</div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-8 text-slate-400">
                            <div className="text-4xl mb-2">📖</div>
                            <p className="text-sm">아직 작성한 묵상이 없습니다.</p>
                        </div>
                    )}
                </div>
                {memoCount > 0 && (
                    <button onClick={() => generateMemosHTML(currentUser.name, memos, { currentDay, score, streak })} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl mt-4 flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors">📥 묵상 기록 다운로드</button>
                )}
                <button onClick={onClose} className="w-full bg-slate-100 font-bold py-3 rounded-xl mt-2 text-slate-600">닫기</button>
            </div>
        </div>
    );
};

export default MemoListModal;
