'use client'

import React, { useState, useEffect } from 'react';
import { Attempt, OngoingGame } from '../../types/index';

interface TimelineProps {
    game: OngoingGame;
    player1Name: string;
    player2Name: string;
    onLatestAttempt: (attempt: Attempt | null) => void;
}

const Timeline: React.FC<TimelineProps> = ({ game, player1Name, player2Name, onLatestAttempt }) => {
    const [expandedRounds, setExpandedRounds] = useState<number[]>([]);

    useEffect(() => {
        const sortedAttempts = Object.values(game.attempts).sort((a, b) => b.attemptNumber - a.attemptNumber);
        onLatestAttempt(sortedAttempts[0] || null);
    }, [game.attempts, onLatestAttempt]);

    const toggleRound = (roundNumber: number) => {
        setExpandedRounds(prev => 
            prev.includes(roundNumber) 
                ? prev.filter(r => r !== roundNumber)
                : [...prev, roundNumber]
        );
    };

    const sortedAttempts = Object.values(game.attempts)
        .sort((a, b) => b.attemptNumber - a.attemptNumber)
        .slice(1); // Exclude the latest attempt

    const currentRound = Math.ceil(game.currentAttempt / 6);

    const roundSummaries: { [key: number]: { attempts: Attempt[], player1Points: number; player2Points: number } } = {};
    sortedAttempts.forEach((attempt) => {
        const roundNumber = Math.ceil(attempt.attemptNumber / 6);
        if (!roundSummaries[roundNumber]) {
            roundSummaries[roundNumber] = { attempts: [], player1Points: 0, player2Points: 0 };
        }
        roundSummaries[roundNumber].attempts.push(attempt);
        if (attempt.attackingPlayerId === game.player1Id) {
            roundSummaries[roundNumber].player1Points += attempt.result.points;
        } else {
            roundSummaries[roundNumber].player2Points += attempt.result.points;
        }
    });

    return (
        <>
            <h4 className="font-semibold mb-2">Timeline</h4>
            <div className="bg-yellow-100 border border-yellow-300 p-4 rounded-lg h-64 overflow-y-auto w-full">
                {/* Current round events (excluding the latest) */}
                {roundSummaries[currentRound]?.attempts.map((attempt) => (
                    <div 
                        key={attempt.attemptId} 
                        className={`mb-2 ${attempt.result.points > 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                        <span className="font-semibold">{attempt.result.points} Points</span> - {attempt.result.description}
                    </div>
                ))}

                {/* Completed rounds */}
                {Object.entries(roundSummaries)
                    .filter(([roundNumber]) => Number(roundNumber) < currentRound)
                    .sort(([a], [b]) => Number(b) - Number(a))
                    .map(([roundNumber, summary]) => {
                        const scoringPlayer = summary.player1Points > summary.player2Points ? player1Name : player2Name;
                        const points = Math.max(summary.player1Points, summary.player2Points);
                        return (
                            <div key={roundNumber} className="border-t border-yellow-400 my-2 pt-2">
                                <div className="flex justify-between items-center">
                                    <span>
                                        <span className="font-semibold">Round {roundNumber}</span> - {scoringPlayer.split(' ')[0]} scored <span className="font-semibold text-green-600">{points} POINTS</span>
                                    </span>
                                    <button 
                                        onClick={() => toggleRound(Number(roundNumber))}
                                        className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                                    >
                                        {expandedRounds.includes(Number(roundNumber)) ? 'Hide' : 'Show More'}
                                    </button>
                                </div>
                                {expandedRounds.includes(Number(roundNumber)) && (
                                    <div className="mt-2 pl-4">
                                        {summary.attempts.map((attempt) => (
                                            <div 
                                                key={attempt.attemptId} 
                                                className={`mb-2 ${attempt.result.points > 0 ? 'text-green-600' : 'text-red-600'}`}
                                            >
                                                <span className="font-semibold">{attempt.result.points} Points</span> - {attempt.result.description}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })
                }
            </div>
        </>
    );
};

export default Timeline;