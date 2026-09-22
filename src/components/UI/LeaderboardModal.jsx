import React from 'react';
import { Trophy, Shield, Skull, Zap, Crosshair, X, Activity, Cpu, User } from 'lucide-react';

export function LeaderboardModal({
  isOpen,
  onClose,
  scoreboardData,
  botDifficulty = 'regular',
  roomId = 'sector7-alpha',
}) {
  if (!isOpen) return null;

  // Sort combatants descending by Score, then by Kills, then ascending by Deaths
  const sortedPlayers = [...scoreboardData].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.kills !== a.kills) return b.kills - a.kills;
    return a.deaths - b.deaths;
  });

  return (
    <div className="leaderboard-backdrop" onClick={onClose}>
      <div className="leaderboard-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="leaderboard-header">
          <div className="header-left">
            <div className="trophy-badge">
              <Trophy size={20} color="#f59e0b" />
            </div>
            <div>
              <div className="modal-title">SECTOR-7 COMBAT LEADERBOARD</div>
              <div className="modal-subtitle">
                <span>ROOM: {roomId.toUpperCase()}</span>
                <span className="dot-sep">•</span>
                <span>MODE: FREE-FOR-ALL</span>
                <span className="dot-sep">•</span>
                <span className="diff-tag">AI DIFFICULTY: {botDifficulty.toUpperCase()}</span>
              </div>
            </div>
          </div>

          <div className="header-right">
            <span className="tab-hint-pill">[TAB] TOGGLE</span>
            <button className="leaderboard-close-btn" onClick={onClose} title="Close Scoreboard">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scoreboard Table */}
        <div className="leaderboard-table-wrap">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th className="th-rank">#</th>
                <th className="th-player">OPERATIVE</th>
                <th className="th-score">SCORE</th>
                <th className="th-stat">KILLS</th>
                <th className="th-stat">DEATHS</th>
                <th className="th-stat">K/D</th>
                <th className="th-status">STATUS</th>
                <th className="th-ping">PING</th>
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map((player, index) => {
                const rank = index + 1;
                const kd = (player.kills / Math.max(1, player.deaths)).toFixed(2);
                const isLocal = player.isLocal;
                const isBot = player.isBot;
                const isDead = player.isDead || player.status === 'K.I.A.';

                let rankBadgeClass = '';
                if (rank === 1) rankBadgeClass = 'rank-gold';
                else if (rank === 2) rankBadgeClass = 'rank-silver';
                else if (rank === 3) rankBadgeClass = 'rank-bronze';

                return (
                  <tr
                    key={player.id}
                    className={`leaderboard-row ${isLocal ? 'row-local-player' : ''} ${
                      isDead ? 'row-dead' : ''
                    }`}
                  >
                    {/* Rank */}
                    <td className="td-rank">
                      <div className={`rank-indicator ${rankBadgeClass}`}>
                        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
                      </div>
                    </td>

                    {/* Operative Name & Type */}
                    <td className="td-player">
                      <div className="player-cell">
                        <div className={`player-avatar-icon ${isLocal ? 'local' : isBot ? 'bot' : 'peer'}`}>
                          {isLocal ? <User size={14} /> : isBot ? <Cpu size={14} /> : <Activity size={14} />}
                        </div>
                        <div className="player-details">
                          <span className="player-name">
                            {player.name}
                            {isLocal && <span className="you-pill">YOU</span>}
                          </span>
                          <span className="player-role">
                            {isLocal ? 'LOCAL OPERATIVE' : isBot ? 'TACTICAL COMBAT AI' : 'REMOTE PEER'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Score */}
                    <td className="td-score">
                      <span className="score-badge">{player.score}</span>
                    </td>

                    {/* Kills */}
                    <td className="td-stat kill-val">
                      <span>{player.kills}</span>
                    </td>

                    {/* Deaths */}
                    <td className="td-stat death-val">
                      <span>{player.deaths}</span>
                    </td>

                    {/* K/D Ratio */}
                    <td className="td-stat kd-val">
                      <span className={Number(kd) >= 1.0 ? 'kd-positive' : 'kd-negative'}>
                        {kd}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="td-status">
                      <span className={`status-pill ${isDead ? 'status-kia' : 'status-active'}`}>
                        {isDead ? 'K.I.A.' : 'ACTIVE'}
                      </span>
                    </td>

                    {/* Ping */}
                    <td className="td-ping">
                      <span className="ping-val">{player.ping || (isBot ? 'BOT' : '15ms')}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer info & tips */}
        <div className="leaderboard-footer">
          <div className="footer-left">
            <span>Elimination: <b>+100 PTS</b></span>
            <span className="dot-sep">•</span>
            <span>Headshot Bonus: <b>+50 PTS</b></span>
          </div>
          <div className="footer-right">
            <span>Press <b>[TAB]</b> or <b>[ESC]</b> to return to battle</span>
          </div>
        </div>
      </div>
    </div>
  );
}
