import { useEffect } from "react";


export default function ChatUI({ playerName, allUsers, chatGroups, handleRefreshChats, handleSendChat, setSelectedChat, selectedChat, chatInput, setChatInput }) {
    const handleInputKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSendChat();
        }
    };

    useEffect(() => {
        console.log('Chat groups updated:', chatGroups);
    }, [chatGroups]);

    return (
        <>
            <div className="w-48 pr-6 border-r border-gray-700">
                <div className="font-bold text-blue-300 mb-2">Players</div>
                <div>
                <button
                    className={`block w-full text-left px-2 py-1 rounded mb-1 ${selectedChat === 'all' ? 'bg-blue-700 text-white' : 'text-blue-200 hover:bg-gray-700'}`}
                    onClick={() => setSelectedChat('all')}
                >
                    All Players
                </button>
                {allUsers.filter(u => u !== playerName).map(u => (
                    <button
                    key={u}
                    className={`block w-full text-left px-2 py-1 rounded mb-1 ${selectedChat === u ? 'bg-blue-700 text-white' : 'text-blue-200 hover:bg-gray-700'}`}
                    onClick={() => setSelectedChat(u)}
                    >
                    {u}
                    </button>
                ))}
                </div>
            </div>
            {/* Chat area */}
            <div className="flex-1 pl-6 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-blue-300">Chat {selectedChat === 'all' ? '' : `with ${selectedChat}`}</h2>
                <button
                    onClick={handleRefreshChats}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow"
                >
                    Refresh Chats
                </button>
                </div>
                <div className="flex flex-col space-y-2">
                    {(chatGroups[selectedChat] || []).length === 0 ? (
                        <div className="text-gray-400 italic">No messages yet.</div>
                    ) : 
                        (chatGroups[selectedChat] || []).map((msg, index) => (
                            <div className={"flex " + (msg.player === playerName ? "justify-end" : "")} key={index}>
                                <div key={index} className={`mb-2 ${msg.player === playerName ? 'bg-gray-300' : 'bg-blue-500'} text-black p-2 rounded-lg max-w-x`}>
                                    {
                                        selectedChat === 'all' && (
                                            // Display player name and on click set selected chat
                                            <div className="text-sm font-bold text-blue-700 cursor-pointer" onClick={() => setSelectedChat(msg.player)}>
                                                {msg.player}
                                            </div>
                                        )
                                    }
                                    <div className="text-lg text-white-300">{msg.text}</div>
                                    <div className="text-xs text-white-500">{new Date(msg.time).toLocaleTimeString()}</div>
                                </div>
                            </div>
                    ))}
                </div>
                <div className="flex gap-2 mt-auto">
                <input
                    className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    type="text"
                    placeholder={`Message to ${selectedChat === 'all' ? 'All Players' : selectedChat}...`}
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    maxLength={300}/>
                <button
                    className="bg-blue-700 hover:bg-blue-800 px-5 py-2 rounded-lg text-white font-bold shadow text-lg"
                    onClick={() => handleSendChat()}
                    disabled={!chatInput.trim()}>
                    Send
                </button>
                </div>
            </div>
        </>
    );
}