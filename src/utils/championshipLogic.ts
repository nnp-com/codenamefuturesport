import { User, TeamMember, MatchResult, Attempt, OngoingGame, AttemptResult, ChampionshipState, Sport, Match } from '../types/index';
import { performAttempt } from './gameRules';
import { getFlavorText, getRandomEvent } from '../utils/flavorTextUtils';
import { 
    createOngoingGame, 
    updateOngoingGame, 
    completeGame, 
    getUserTeamData, 
    getOngoingGames,
    getOngoingGame,
    getEnteredPlayers,
    addMatchToHistory,
    getAllCompletedMatches,
    updateChampionshipState,
    getChampionshipState,
    updatePlayerStats,
    deleteOngoingGame,
    clearMatchHistory,
    resetPlayerStats,
    clearOngoingGames,
} from '../lib/firebaseConfig';
import { v4 as uuidv4 } from 'uuid';

export const startChampionship = async (): Promise<void> => {
    console.log('Starting championship...');
    try {
        const enteredPlayers = await getEnteredPlayers() as User[];
        console.log('Entered players:', enteredPlayers);
        
        if (enteredPlayers.length < 2 || enteredPlayers.length % 2 !== 0) {
            console.error('Invalid number of players to start a championship');
            throw new Error('Invalid number of players to start a championship');
        }

        const matchSets = generateMatchSets(enteredPlayers);

        const remainingMatches: ChampionshipState['remainingMatches'] = {};
        matchSets.slice(1).forEach((set, index) => {
            remainingMatches[index.toString()] = set;
        });

        const initialState: ChampionshipState = {
            currentStage: 1,
            matchesPlayed: [],
            remainingMatches: remainingMatches,
            isFinished: false,
            standings: enteredPlayers.map(player => ({ playerId: player.uid, points: 0 }))
        };

        await updateChampionshipState(initialState);

        // Create initial ongoing games
        for (const match of matchSets[0]) {
            await createOngoingGame(match.player1Id, match.player2Id);
        }

        console.log('Championship started successfully with initial matches');
    } catch (error) {
        console.error('Error starting championship:', error);
        throw error;
    }
};

const generateMatchSets = (players: User[]): Match[][] => {
    const n = players.length;
    const rounds = n - 1;
    const matchesPerRound = n / 2;

    let playerIds = players.map(p => p.uid);
    const matchSets: Match[][] = [];

    for (let round = 0; round < rounds; round++) {
        const matchSet: Match[] = [];
        for (let i = 0; i < matchesPerRound; i++) {
            const match: Match = {
                player1Id: playerIds[i],
                player2Id: playerIds[n - 1 - i]
            };
            matchSet.push(match);
        }
        matchSets.push(matchSet);

        // Rotate players, keeping the first player fixed
        playerIds = [playerIds[0], ...playerIds.slice(-1), ...playerIds.slice(1, -1)];
    }

    return matchSets;
};

const shuffleArray = <T>(array: T[]): T[] => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

export const simulateChampionship = async (): Promise<void> => {
    const ongoingGames = await getOngoingGames();
    const state = await getChampionshipState();

    for (const game of ongoingGames) {
        if (game.currentAttempt < 72) {
            await executeAttempt(game.id!);
        }
    }

    // Check if all games are completed
    const updatedOngoingGames = await getOngoingGames();
    if (updatedOngoingGames.length === 0) {
        if (Object.keys(state.remainingMatches).length > 0) {
            await createNextSetOfMatches(state);
        } else if (!state.isFinished) {
            await finalizeChampionship(state);
        }
    }
};

const createNextSetOfMatches = async (state: ChampionshipState) => {
    const nextStageIndex = Object.keys(state.remainingMatches).sort((a, b) => Number(a) - Number(b))[0];
    if (nextStageIndex) {
        const nextMatchSet = state.remainingMatches[nextStageIndex];
        
        for (const match of nextMatchSet) {
            await createOngoingGame(match.player1Id, match.player2Id);
        }

        delete state.remainingMatches[nextStageIndex];
        state.currentStage++;
        await updateChampionshipState(state);
    } else {
        console.log('No more matches to create. Championship is finishing.');
        await finalizeChampionship(state);
    }
};


export const resetChampionship = async (): Promise<void> => {
    try {
        // Clear ongoing games
        await clearOngoingGames();

        // Clear match history
        await clearMatchHistory();

        // Clear championship state
        await updateChampionshipState({
            currentStage: 0,
            matchesPlayed: [], // Assuming a default value
            remainingMatches: {}, // Changed to an empty object
            isFinished: false, // Assuming a default value
            standings: [] // Assuming a default value
        });

        // Reset player stats
        const players = await getEnteredPlayers() as User[];
        for (const player of players) {
            await resetPlayerStats(player.uid);
        }

        console.log('Championship reset successfully');
    } catch (error) {
        console.error('Error resetting championship:', error);
        throw error;
    }
};

export const executeAttempt = async (gameId: string): Promise<void> => {
    const game = await getOngoingGame(gameId);
    if (!game) {
        console.error(`No game data found for gameId: ${gameId}`);
        return;
    }

    const player1Data = await getUserTeamData(game.player1Id);
    const player2Data = await getUserTeamData(game.player2Id);

    if (!player1Data || !player2Data) {
        console.error('Failed to get player team data');
        return;
    }

    const isPlayer1Attacking = Math.floor(game.currentAttempt / 6) % 2 === 0;
    const attackingPlayerId = isPlayer1Attacking ? game.player1Id : game.player2Id;
    const defendingPlayerId = isPlayer1Attacking ? game.player2Id : game.player1Id;
    const attackerTeam = isPlayer1Attacking ? player1Data.members : player2Data.members;
    const defenderTeam = isPlayer1Attacking ? player2Data.members : player1Data.members;

    const attackerCardIndex = game.currentAttempt % attackerTeam.length;
    const defenderCardIndex = game.currentAttempt % defenderTeam.length;
    const attacker = attackerTeam[attackerCardIndex];
    const defender = defenderTeam[defenderCardIndex];

    const attemptResult = performAttempt(attacker, defender);

    const attempt: Attempt = {
        attemptId: uuidv4(),
        attemptNumber: game.currentAttempt + 1,
        roundNumber: Math.floor((game.currentAttempt + 1) / 6) + 1,
        attackingPlayerId,
        defendingPlayerId,
        attackerCardId: attacker.id,
        defenderCardId: defender.id,
        isPlayer1Attacking,  // Add this line
        result: attemptResult,
    };

    await updateOngoingGame(gameId, attempt);

    // Check if this was the last attempt
    if (attempt.attemptNumber === 72) {
        await finalizeGame(gameId);
    }
};

export const finalizeGame = async (gameId: string): Promise<void> => {
    const game = await getOngoingGame(gameId);

    if (!game) {
        console.error(`No game data found for gameId: ${gameId}`);
        return;
    }

    const winner = game.player1Score > game.player2Score ? 'player1' : 'player2';

    const rounds: MatchResult['rounds'] = {};
    for (const [attemptId, attempt] of Object.entries(game.attempts)) {
        rounds[attemptId] = {
            roundNumber: attempt.roundNumber,
            attacker: attempt.attackingPlayerId,
            defender: attempt.defendingPlayerId,
            isPlayer1Attacking: attempt.attackingPlayerId === game.player1Id,
            result: attempt.result
        };
    }

    const matchResult: MatchResult = {
        matchId: gameId,
        player1Id: game.player1Id,
        player2Id: game.player2Id,
        player1TotalScore: game.player1Score,
        player2TotalScore: game.player2Score,
        winner: game[`${winner}Id`],
        rounds: rounds,
    };

    await addMatchToHistory(matchResult);
    await updatePlayerStats(game.player1Id, game.player1Score, winner === 'player1');
    await updatePlayerStats(game.player2Id, game.player2Score, winner === 'player2');

    // Delete the game from ongoing games
    await deleteOngoingGame(gameId);

    // Update championship state
    const state = await getChampionshipState();
    state.matchesPlayed.push(matchResult);
    updateChampionshipStandings(state, matchResult);

    await updateChampionshipState(state);

    // Check if we need to start new games or finalize the championship
    const ongoingGames = await getOngoingGames();
    if (ongoingGames.length === 0) {
        if (Object.keys(state.remainingMatches).length > 0) {
            await createNextSetOfMatches(state);
        } else {
            await finalizeChampionship(state);
        }
    }
};

const updateChampionshipStandings = (state: ChampionshipState, matchResult: MatchResult): void => {
    const updatePlayerStanding = (playerId: string, score: number) => {
        const playerStanding = state.standings.find(s => s.playerId === playerId);
        if (playerStanding) {
            playerStanding.points += score;
        }
    };

    updatePlayerStanding(matchResult.player1Id, matchResult.player1TotalScore);
    updatePlayerStanding(matchResult.player2Id, matchResult.player2TotalScore);

    state.standings.sort((a, b) => b.points - a.points);
};

const finalizeChampionship = async (state: ChampionshipState) => {
    state.isFinished = true;
    await updateChampionshipState(state);
    console.log('Championship finished!');
    // Implement any end-of-championship logic here, such as:
    // - Sending notifications to players
    // - Updating player rankings
    // - Preparing for the next championship
};


export const getChampionshipStandings = async (): Promise<{ userId: string, points: number }[]> => {
    const players = await getEnteredPlayers() as User[];
    const standings: { userId: string, points: number }[] = players.map(player => ({
        userId: player.uid,
        points: 0,
    }));

    const completedMatches = await getAllCompletedMatches();

    for (const match of completedMatches) {
        const player1Standing = standings.find(s => s.userId === match.player1Id);
        const player2Standing = standings.find(s => s.userId === match.player2Id);

        if (player1Standing) player1Standing.points += match.player1TotalScore;
        if (player2Standing) player2Standing.points += match.player2TotalScore;
    }

    return standings.sort((a, b) => b.points - a.points);
};

export const simulateRound = async (): Promise<void> => {
    const ongoingGames = await getOngoingGames();

    for (const game of ongoingGames) {
        const currentRound = Math.floor(game.currentAttempt / 6) + 1;
        const attemptsInCurrentRound = game.currentAttempt % 6;
        const attemptsToSimulate = 6 - attemptsInCurrentRound;

        for (let i = 0; i < attemptsToSimulate; i++) {
            await executeAttempt(game.id!);
        }

        // Check if the game is completed after simulating the round
        const updatedGame = await getOngoingGames().then(games => games.find(g => g.id === game.id));
        if (updatedGame && updatedGame.currentAttempt >= 72) {
            await finalizeGame(game.id!);
        }
    }

};