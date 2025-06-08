import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { joinLobby, sendMessageToLobby, disconnectFromServer } from "../utils/lobby";

function LobbyWaitingRoom() {
    // Country list with language mapping
    const countryList = [
        { en: "France", ru: "Франция", uk: "Франція" },
        { en: "Germany", ru: "Германия", uk: "Німеччина" },
        { en: "Israel", ru: "Израиль", uk: "Ізраїль" },
        { en: "Kazakhstan", ru: "Казахстан", uk: "Казахстан" },
        { en: "North Korea", ru: "Северная Корея", uk: "Північна Корея" },
        { en: "Russia", ru: "Россия", uk: "Росія" },
        { en: "Ukraine", ru: "Украина", uk: "Україна" },
        { en: "USA", ru: "США", uk: "США" }
    ];
    const { lobbyId } = useParams();
    const navigate = useNavigate();
    const playerName = localStorage.getItem('playerName');
    const [lobbyData, setLobbyData] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [country, setCountry] = useState(localStorage.getItem('country') || '');
    const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');
    const [countdown, setCountdown] = useState(null);
    const [lobbyPings, setLobbyPings] = useState({});
    const pingTimer = useRef(null);
    const lastPingTs = useRef(null);

    // Helper to determine if current user is host
    const isHost = lobbyData && lobbyData.host === playerName;

    useEffect(() => {
        joinLobby(
            lobbyId,
            playerName,
            (data) => setLobbyData(data),
            null,
            (msg) => setMessages((prev) => [...prev, msg])
        );
        if (window.socket) {
            window.socket.on('start_countdown', (seconds) => {
                setCountdown(seconds);
            });
            window.socket.on('move_to_game', () => {
                navigate(`/lobby/${lobbyId}/game`);
            });
        }
        return () => {
            disconnectFromServer();
            if (window.socket) {
                window.socket.off && window.socket.off('start_countdown');
                window.socket.off && window.socket.off('move_to_game');
            }
        };
    }, [lobbyId, playerName, navigate]);

    useEffect(() => {
        if (country) {
            localStorage.setItem('country', country);
            if (window.socket) {
                window.socket.emit && window.socket.emit('update_country', { lobbyId, playerName, country });
            }
        }
    }, [country, lobbyId, playerName]);

    useEffect(() => {
        console.log(messages);
    }, [messages]);

    useEffect(() => {
        if (lang) {
            localStorage.setItem('lang', lang);
        }
    }, [lang]);

    // Countdown effect
    useEffect(() => {
        if (countdown === null) return;
        if (countdown === 0) return;
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
    }, [countdown]);

    // --- PING LOGIC ---
    useEffect(() => {
        if (!window.socket || !lobbyId || !playerName) return;
        // Listen for pong
        const handlePong = ({ ts }) => {
            if (lastPingTs.current && ts === lastPingTs.current) {
                const ping = Date.now() - ts;
                // Report measured ping to server
                window.socket.emit && window.socket.emit('report_ping', { lobbyId, playerName, ping });
            }
        };
        window.socket.on && window.socket.on('pong', handlePong);
        // Listen for lobby_pings
        const handleLobbyPings = (pings) => {
            setLobbyPings(pings || {});
        };
        window.socket.on && window.socket.on('lobby_pings', handleLobbyPings);
        // Start periodic ping
        pingTimer.current = setInterval(() => {
            const ts = Date.now();
            lastPingTs.current = ts;
            window.socket.emit && window.socket.emit('ping', { lobbyId, playerName, ts });
        }, 3000);
        // Cleanup
        return () => {
            if (window.socket) {
                window.socket.off && window.socket.off('pong', handlePong);
                window.socket.off && window.socket.off('lobby_pings', handleLobbyPings);
            }
            if (pingTimer.current) clearInterval(pingTimer.current);
        };
    }, [lobbyId, playerName]);

    const handleSend = () => {
        if (input.trim()) {
            let msg = {
                player: playerName,
                msg: input,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            sendMessageToLobby(msg);
            setInput("");
        }
    };

    const handleStartGame = () => {
        if (window.socket) {
            window.socket.emit('start_game', { lobbyId });
        }
    };

    const handleLangChange = (e) => {
        setLang(e.target.value);
        localStorage.setItem('lang', e.target.value);
    };

    return (
        <div className="waiting-room flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
            <div className="w-full max-w-xl bg-gray-800 rounded-lg shadow-lg p-6">
                <h1 className="text-2xl font-bold mb-4 text-center">Lobby: <span className="text-blue-400">{lobbyId}</span></h1>
                <div className="mb-4 flex flex-col items-center">
                    <label className="mb-2 font-semibold">Select your country:</label>
                    <div className="flex gap-2 mb-2">
                        <select
                            className="p-2 rounded text-black"
                            value={country}
                            onChange={e => setCountry(e.target.value)}
                        >
                            <option value="">-- Select --</option>
                            {countryList.map((c) => (
                                <option key={c.en} value={c.en}>{c[lang]}</option>
                            ))}
                        </select>
                        <select value={lang} onChange={handleLangChange} className="p-2 rounded text-black">
                            <option value="en">EN</option>
                            <option value="ru">RU</option>
                            <option value="uk">UA</option>
                        </select>
                    </div>
                </div>
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-2 border-b border-gray-700 pb-1">Players</h2>
                    <ul className="space-y-2">
                        {lobbyData?.players?.map((p, i) => (
                            <li key={i} className={
                                p.name === playerName
                                    ? "font-bold text-green-400 bg-gray-700 rounded px-2 py-1"
                                    : "text-gray-200 bg-gray-700 rounded px-2 py-1"
                            }>
                                {p.name} {p.name === playerName && <span className="text-xs text-green-300">(You)</span>} <span className="ml-2 text-xs text-blue-300">{p.country || ''}</span>
                                {typeof lobbyPings?.[p.name] === 'number' && (
                                    <span className="ml-2 text-xs" style={{ color: lobbyPings[p.name] < 100 ? '#4ade80' : lobbyPings[p.name] < 200 ? '#facc15' : '#f87171' }}>
                                        {lobbyPings[p.name]} ms
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
                {isHost && countdown === null && (
                    <button
                        className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded font-semibold mb-4"
                        onClick={handleStartGame}
                    >
                        Start Game
                    </button>
                )}
                {countdown !== null && countdown > 0 && (
                    <div className="text-center text-2xl text-yellow-400 mb-4">Game starting in {countdown}...</div>
                )}
                <div className="mb-4">
                    <h2 className="text-lg font-semibold mb-2 border-b border-gray-700 pb-1">Chat</h2>
                    <div className="h-40 overflow-y-auto bg-gray-900 border border-gray-700 rounded p-2 mb-2">
                        {messages.length === 0 ? (
                            <div className="text-gray-500 text-center">No messages yet.</div>
                        ) : (
                            messages.map((msg, i) => (
                                <div key={i} className="mb-2">
                                    <span className={"font-semibold " + (msg.player === playerName ? " text-green-400" : "text-yellow-300")}>{msg.player}</span>: {msg.msg} <span className="text-xs text-gray-500">({msg.time})</span>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="flex gap-2">
                        <input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                            className="flex-1 px-3 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Type a message..."
                        />
                        <button
                            onClick={handleSend}
                            className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded font-semibold"
                        >
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LobbyWaitingRoom;