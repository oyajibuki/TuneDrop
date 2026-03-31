import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Heart, LogIn, Send, X, Clock, AlertCircle, Apple, Camera, MoreVertical, Flag, Ban, Settings, Trash2, LogOut } from 'lucide-react';
import { supabase } from './lib/supabase';

// --- 定数 ---
const NG_WORDS = ['バカ', '死ね', 'LINE', 'メアド', '@', '.com', 'http', 'sex'];
const INITIAL_ROOM_TIME = 300;
const EXTEND_TIME = 300;
const CANVAS_SIZE = 3000;
const DROP_LIFETIME = 30 * 60 * 1000; // 30分

const REDIRECT_URL = 'https://oyajibuki.github.io/TuneDrop/';

// --- ヘルパー ---
const calculateAgeGroup = (birthDate) => {
  if (!birthDate) return '秘密';
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  if (age < 10) return '10代未満';
  return `${Math.floor(age / 10) * 10}代`;
};

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const toLocalDrop = (drop, myUserId) => ({
  id: drop.id,
  text: drop.text,
  userId: drop.user_id,
  userName: drop.users?.name || '匿名',
  ageGroup: calculateAgeGroup(drop.users?.birth_date),
  avatar: drop.users?.avatar_url || `https://i.pravatar.cc/150?u=${drop.user_id}`,
  color: drop.color,
  x: drop.pos_x,
  y: drop.pos_y,
  animType: drop.anim_type,
  animDelay: Math.random() * -5,
  isMine: drop.user_id === myUserId,
  isOnline: drop.users?.is_online ?? true,
  likes: 0,
  likedByMe: false,
  createdAt: new Date(drop.created_at).getTime(),
});

// --- LoginScreen ---
const LoginScreen = ({ onGoogleLogin }) => {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-sky-400 to-sky-200 text-white p-6 relative">
      <h1 className="text-5xl font-bold mb-4 tracking-wider text-white drop-shadow-md">TuneDrop</h1>
      <p className="text-sky-50 mb-8 text-center drop-shadow-sm font-medium">
        必要最低限で繋がる。<br />5分で消える、今の思い。
      </p>

      <label className="flex items-center gap-3 mb-8 text-sm text-sky-50 bg-black/10 px-5 py-3 rounded-2xl cursor-pointer hover:bg-black/20 transition backdrop-blur-sm border border-white/20 w-full max-w-sm">
        <input
          type="checkbox"
          checked={agreed}
          onChange={e => setAgreed(e.target.checked)}
          className="w-5 h-5 rounded border-sky-200 text-sky-500 focus:ring-sky-500 bg-white/20 cursor-pointer"
        />
        <span className="font-medium leading-tight">利用規約とプライバシーポリシーに同意する</span>
      </label>

      <div className="w-full max-w-sm space-y-3">
        <button
          onClick={() => agreed && onGoogleLogin()}
          className={`w-full py-4 bg-white text-slate-700 rounded-2xl font-bold flex items-center justify-center gap-2 transition shadow-md ${!agreed ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-50'}`}
        >
          <LogIn size={20} /> Googleでログイン
        </button>
      </div>
    </div>
  );
};

// --- ProfileScreen ---
const ProfileScreen = ({ userProfile, setUserProfile, onSubmit }) => (
  <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-sky-400 to-sky-200 text-white p-6">
    <h2 className="text-2xl font-bold mb-6 drop-shadow-md">あなたについて教えてください</h2>
    <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 bg-white/20 p-6 rounded-2xl backdrop-blur-md shadow-lg">
      <div className="flex flex-col items-center mb-4">
        <div className="w-24 h-24 bg-sky-100 rounded-full flex items-center justify-center text-sky-400 mb-2 border-4 border-white shadow-sm overflow-hidden relative">
          <Camera size={32} />
        </div>
      </div>
      <div>
        <label className="block text-sm text-sky-50 mb-1 font-medium">名前（ニックネームOK）</label>
        <input
          type="text" required
          className="w-full bg-white/90 border-none rounded-lg p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400 shadow-inner"
          value={userProfile.name}
          onChange={e => setUserProfile({ ...userProfile, name: e.target.value })}
          placeholder="そら太郎"
        />
      </div>
      <div>
        <label className="block text-sm text-sky-50 mb-1 font-medium">生年月日</label>
        <input
          type="date" required
          className="w-full bg-white/90 border-none rounded-lg p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400 shadow-inner"
          value={userProfile.birthDate}
          onChange={e => setUserProfile({ ...userProfile, birthDate: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-sm text-sky-50 mb-1 font-medium">性別</label>
        <select
          required
          className="w-full bg-white/90 border-none rounded-lg p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400 shadow-inner"
          value={userProfile.gender}
          onChange={e => setUserProfile({ ...userProfile, gender: e.target.value })}
        >
          <option value="" disabled>選択してください</option>
          <option value="male">男性</option>
          <option value="female">女性</option>
          <option value="other">その他</option>
          <option value="no_answer">回答しない</option>
        </select>
      </div>
      <button type="submit" className="w-full py-3 mt-6 bg-white text-sky-500 rounded-full font-bold shadow-md hover:bg-sky-50 transition">
        Wave Spaceへ
      </button>
    </form>
  </div>
);

// --- SpaceScreen ---
const SpaceScreen = ({
  drops, setDrops, camera, setCamera, now,
  myDropText, setMyDropText, myDropCooldown, handleMyDrop,
  selectedDrop, setSelectedDrop, handleCatch, handleSyncRequest, handleDeleteDrop, handleLike,
  handleBlock, handleReport, setIsSettingsOpen,
  scale, setScale,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [draggingDropId, setDraggingDropId] = useState(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const initialDistRef = useRef(null);
  const clickStartRef = useRef({ x: 0, y: 0 });
  const [showMenu, setShowMenu] = useState(false);
  const canvasContainerRef = useRef(null);
  const scaleRef = useRef(scale);
  const cameraRef = useRef(camera);
  const isPinchingRef = useRef(false);
  scaleRef.current = scale;
  cameraRef.current = camera;

  useEffect(() => { setShowMenu(false); }, [selectedDrop]);

  useEffect(() => {
    const el = canvasContainerRef.current;
    if (!el) return;
    let pendingUpdate = null;
    let animFrameId = null;
    const commitState = () => {
      if (pendingUpdate) { setScale(pendingUpdate.scale); setCamera(pendingUpdate.camera); pendingUpdate = null; }
      animFrameId = null;
    };
    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        isPinchingRef.current = true;
        initialDistRef.current = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      }
    };
    const onTouchMove = (e) => {
      if (e.touches.length === 2 && initialDistRef.current) {
        e.preventDefault();
        const currentDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        const ratio = 1 + (currentDist / initialDistRef.current - 1) * 0.6;
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
        const currentScale = pendingUpdate ? pendingUpdate.scale : scaleRef.current;
        const currentCam = pendingUpdate ? pendingUpdate.camera : cameraRef.current;
        const newScale = Math.min(Math.max(0.3, currentScale * ratio), 2.5);
        const newCam = {
          x: ((currentCam.x + (midX - cx) * (1 / currentScale - 1 / newScale)) + CANVAS_SIZE) % CANVAS_SIZE,
          y: ((currentCam.y + (midY - cy) * (1 / currentScale - 1 / newScale)) + CANVAS_SIZE) % CANVAS_SIZE,
        };
        pendingUpdate = { scale: newScale, camera: newCam };
        if (!animFrameId) animFrameId = requestAnimationFrame(commitState);
        initialDistRef.current = currentDist;
      }
    };
    const onTouchEnd = (e) => {
      if (e.touches.length < 2) { isPinchingRef.current = false; initialDistRef.current = null; }
    };
    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      if (animFrameId) cancelAnimationFrame(animFrameId);
    };
  }, []);

  const handleWheel = (e) => {
    e.preventDefault();
    const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    const prevScale = scaleRef.current;
    const newScale = Math.min(Math.max(0.3, prevScale - e.deltaY * 0.001), 2.5);
    setScale(newScale);
    setCamera({
      x: ((cameraRef.current.x + (e.clientX - cx) * (1 / prevScale - 1 / newScale)) + CANVAS_SIZE) % CANVAS_SIZE,
      y: ((cameraRef.current.y + (e.clientY - cy) * (1 / prevScale - 1 / newScale)) + CANVAS_SIZE) % CANVAS_SIZE,
    });
  };

  const handlePointerDown = (e) => { setIsDragging(true); setStartPos({ x: e.clientX, y: e.clientY }); };
  const handlePointerMove = (e) => {
    if (isPinchingRef.current) return;
    if (draggingDropId) {
      const dx = (e.clientX - startPos.x) / scale, dy = (e.clientY - startPos.y) / scale;
      setDrops(prev => prev.map(d => d.id === draggingDropId ? { ...d, x: (d.x + dx + CANVAS_SIZE) % CANVAS_SIZE, y: (d.y + dy + CANVAS_SIZE) % CANVAS_SIZE } : d));
      setStartPos({ x: e.clientX, y: e.clientY });
    } else if (isDragging) {
      const dx = (e.clientX - startPos.x) / scale, dy = (e.clientY - startPos.y) / scale;
      setCamera(prev => ({ x: ((prev.x - dx) % CANVAS_SIZE + CANVAS_SIZE) % CANVAS_SIZE, y: ((prev.y - dy) % CANVAS_SIZE + CANVAS_SIZE) % CANVAS_SIZE }));
      setStartPos({ x: e.clientX, y: e.clientY });
    }
  };
  const handlePointerUp = (e) => {
    if (draggingDropId) {
      const drop = drops.find(d => d.id === draggingDropId);
      const dist = Math.hypot(e.clientX - clickStartRef.current.x, e.clientY - clickStartRef.current.y);
      if (dist < 10 && drop) handleCatch(drop);
      setDraggingDropId(null);
    }
    setIsDragging(false);
    initialDistRef.current = null;
  };
  const onDropPointerDown = (e, drop) => {
    e.stopPropagation();
    setDraggingDropId(drop.id);
    setStartPos({ x: e.clientX, y: e.clientY });
    clickStartRef.current = { x: e.clientX, y: e.clientY };
  };
  const stopPropagation = (e) => e.stopPropagation();

  return (
    <div className="relative h-screen w-full bg-gradient-to-b from-sky-400 via-sky-300 to-sky-100 overflow-hidden">
      <style>{`
        @keyframes float1 { 0%,100%{transform:translate(-50%,-50%)} 50%{transform:translate(calc(-50% + 15px),calc(-50% - 20px))} }
        @keyframes float2 { 0%,100%{transform:translate(-50%,-50%)} 50%{transform:translate(calc(-50% - 20px),calc(-50% - 10px))} }
        @keyframes float3 { 0%,100%{transform:translate(-50%,-50%)} 50%{transform:translate(calc(-50% + 10px),calc(-50% - 30px))} }
        @keyframes flash  { 0%{opacity:0.6} 100%{opacity:0} }
      `}</style>

      <button onClick={() => setIsSettingsOpen(true)} className="absolute top-6 right-6 z-40 p-3 bg-white/40 backdrop-blur-md border border-white/60 rounded-full text-slate-700 hover:bg-white/60 transition shadow-sm">
        <Settings size={22} />
      </button>

      <div
        ref={canvasContainerRef}
        className="absolute inset-0 touch-none select-none overflow-hidden z-0"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
        style={{ cursor: isDragging && !draggingDropId ? 'grabbing' : 'grab' }}
      >
        <div className="absolute inset-0 origin-center" style={{ transform: `scale(${scale})`, transition: isDragging || draggingDropId ? 'none' : 'transform 0.15s ease-out' }}>
          {drops.map(drop => {
            const age = now - drop.createdAt;
            const lifeRatio = Math.max(0, 1 - age / DROP_LIFETIME);
            const opacity = lifeRatio > 0.05 ? 1 : lifeRatio * 20;
            const likes = drop.likes || 0;
            const dropScale = drop.isPopping ? 1.2 : 1;
            const glowShadow = likes > 0 ? `0 0 ${15 + likes * 10}px ${drop.color}, inset 0 0 10px rgba(255,255,255,0.8)` : `0 8px 32px rgba(255,255,255,0.4)`;
            const borderColor = likes > 0 ? drop.color : 'rgba(255,255,255,0.7)';
            const isBeingDragged = draggingDropId === drop.id;
            let dx = (drop.x - camera.x) % CANVAS_SIZE;
            if (dx > CANVAS_SIZE / 2) dx -= CANVAS_SIZE;
            if (dx < -CANVAS_SIZE / 2) dx += CANVAS_SIZE;
            let dy = (drop.y - camera.y) % CANVAS_SIZE;
            if (dy > CANVAS_SIZE / 2) dy -= CANVAS_SIZE;
            if (dy < -CANVAS_SIZE / 2) dy += CANVAS_SIZE;
            const cx = typeof window !== 'undefined' ? window.innerWidth / 2 : 200;
            const cy = typeof window !== 'undefined' ? window.innerHeight / 2 : 400;
            return (
              <div
                key={drop.id}
                onPointerDown={(e) => onDropPointerDown(e, drop)}
                className="absolute flex flex-col items-center justify-center cursor-pointer group"
                style={{ left: `${cx + dx}px`, top: `${cy + dy}px`, opacity, animation: isBeingDragged ? 'none' : `float${drop.animType} ${4 + drop.animType}s ease-in-out infinite`, animationDelay: isBeingDragged ? '0s' : `${drop.animDelay}s`, zIndex: isBeingDragged ? 50 : 10 }}
              >
                <div
                  className={`flex items-center gap-3 p-2 pr-6 rounded-full bg-white/40 backdrop-blur-md transition-all duration-300 ease-out group-hover:bg-white/60 ${isBeingDragged ? 'ring-2 ring-white/50 scale-105' : ''}`}
                  style={{ transform: `scale(${dropScale})`, boxShadow: glowShadow, border: `2px solid ${borderColor}` }}
                >
                  <div className="relative">
                    <img src={drop.avatar} alt="avatar" className="w-12 h-12 rounded-full border-2 border-white object-cover shadow-sm pointer-events-none" draggable="false" />
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${drop.isOnline ? 'bg-green-500' : 'bg-slate-400'}`}></span>
                  </div>
                  <span className="text-base font-bold whitespace-nowrap text-slate-700 drop-shadow-sm pointer-events-none">{drop.text}</span>
                  {likes > 0 && (
                    <span className="flex items-center gap-1 text-pink-500 text-sm font-bold ml-1 pointer-events-none">
                      <Heart size={14} fill="currentColor" /> {likes}
                    </span>
                  )}
                </div>
                {drop.isMine && <span className="absolute -top-4 -right-2 bg-sky-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm z-10 pointer-events-none">Me</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Catch Popup */}
      {selectedDrop && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-md p-6 rounded-3xl shadow-2xl z-50 flex flex-col items-center min-w-[280px]"
          onPointerDown={stopPropagation} onPointerMove={stopPropagation} onPointerUp={stopPropagation}>
          <button className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1" onClick={() => setSelectedDrop(null)}><X size={20} /></button>
          {!selectedDrop.isMine && (
            <div className="absolute top-4 left-4">
              <button className="text-slate-400 hover:text-slate-600 p-1" onClick={() => setShowMenu(!showMenu)}><MoreVertical size={20} /></button>
              {showMenu && (
                <div className="absolute top-8 left-0 bg-white shadow-xl rounded-xl py-2 w-44 z-50 border border-slate-100">
                  <button onClick={handleReport} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 font-medium"><Flag size={16} /> 通報する</button>
                  <button onClick={() => handleBlock(selectedDrop.userName)} className="w-full text-left px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-3 font-medium"><Ban size={16} /> ブロックする</button>
                </div>
              )}
            </div>
          )}
          <img src={selectedDrop.avatar} className="w-20 h-20 rounded-full mb-3 border-4 border-sky-100 shadow-inner object-cover" alt="avatar" />
          <div className="flex flex-col items-center mb-4">
            <span className="text-sm font-bold text-slate-500">{selectedDrop.userName} ({selectedDrop.ageGroup})</span>
            <span className={`text-xs font-bold px-2 py-0.5 mt-1 rounded-full ${selectedDrop.isOnline ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
              {selectedDrop.isOnline ? 'オンライン' : 'オフライン'}
            </span>
          </div>
          <p className="text-xl font-bold mb-8 text-slate-800 text-center">"{selectedDrop.text}"</p>
          {selectedDrop.isMine ? (
            <button onClick={() => handleDeleteDrop(selectedDrop.id)} className="w-full py-3.5 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center gap-2 hover:bg-rose-100 transition font-bold shadow-sm">
              Dropを取り消す
            </button>
          ) : (
            <div className="flex w-full gap-3">
              <button
                onClick={() => handleLike(selectedDrop.id)}
                disabled={selectedDrop.likedByMe}
                className={`flex-1 py-3.5 rounded-2xl flex items-center justify-center gap-2 transition font-bold shadow-sm ${selectedDrop.likedByMe ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-pink-50 text-pink-500 hover:bg-pink-100'}`}
              >
                <Heart size={20} fill={selectedDrop.likedByMe ? 'currentColor' : 'none'} />
                {selectedDrop.likedByMe ? 'いいね済み' : 'いいね'}
              </button>
              <button
                onClick={handleSyncRequest}
                className="flex-1 py-3.5 rounded-2xl flex items-center justify-center gap-2 font-bold shadow-md transition bg-gradient-to-r from-sky-500 to-blue-500 text-white hover:opacity-90"
              >
                <MessageCircle size={20} /> 会話する
              </button>
            </div>
          )}
        </div>
      )}

      {/* Drop Input */}
      <div
        className="absolute left-1/2 transform -translate-x-1/2 w-[90%] max-w-md z-40"
        style={{ bottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
        onPointerDown={stopPropagation} onPointerMove={stopPropagation} onPointerUp={stopPropagation}
      >
        <form onSubmit={handleMyDrop} className="relative">
          <input
            name="dropText" type="text"
            value={myDropText}
            onChange={(e) => setMyDropText(e.target.value)}
            placeholder={myDropCooldown > 0 ? `次のDropまで ${myDropCooldown}秒...` : "今の気持ちをDropする..."}
            disabled={myDropCooldown > 0}
            className="w-full bg-white/80 border-2 border-white backdrop-blur-md rounded-full py-4 pl-6 pr-14 text-slate-800 placeholder-slate-500 focus:outline-none focus:bg-white shadow-lg disabled:opacity-70"
            maxLength={30}
          />
          <button type="submit" disabled={myDropCooldown > 0} className="absolute right-2 top-2 bottom-2 aspect-square bg-sky-500 text-white rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-sky-600 transition shadow-sm">
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

// --- RoomScreen ---
const RoomScreen = ({ roomTime, chatPartner, messages, chatInput, setChatInput, handleSendMessage, errorMessage, handleNext, handleExtend, extendRequested, handleReport, handleBlockAndExit }) => {
  const [showRoomMenu, setShowRoomMenu] = useState(false);
  const bottomRef = useRef(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-sky-50 text-slate-800 relative">
      <div className="flex items-center justify-between p-4 bg-white/90 backdrop-blur-md border-b border-sky-100 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <img src={chatPartner?.avatar || 'https://i.pravatar.cc/150?u=me'} alt="avatar" className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover" />
          <span className="font-bold text-slate-700">{chatPartner?.userName || '匿名'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 font-mono text-xl font-bold ${roomTime <= 10 ? 'text-rose-500 animate-pulse' : 'text-sky-500'}`}>
            <Clock size={20} />{formatTime(roomTime)}
          </div>
          <button onClick={handleNext} className="text-sm px-4 py-2 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-full transition font-bold ml-2">Next</button>
          <div className="relative ml-1">
            <button onClick={() => setShowRoomMenu(!showRoomMenu)} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full transition"><MoreVertical size={20} /></button>
            {showRoomMenu && (
              <div className="absolute top-12 right-0 bg-white shadow-2xl rounded-xl py-2 w-48 z-50 border border-slate-100">
                <button onClick={() => { handleReport(); setShowRoomMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 font-medium"><Flag size={18} /> 通報する</button>
                <button onClick={() => { handleBlockAndExit(chatPartner?.userName); setShowRoomMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-3 font-medium"><Ban size={18} /> ブロックして退出</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-sky-100 to-sky-50 pb-20">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.isSystem ? 'justify-center' : msg.isMine ? 'justify-end' : 'justify-start'}`}>
            {msg.isSystem
              ? <span className="text-xs text-slate-500 bg-white/60 px-4 py-1.5 rounded-full font-medium shadow-sm">{msg.text}</span>
              : <div className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-sm text-sm ${msg.isMine ? 'bg-sky-500 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none'}`}>{msg.text}</div>
            }
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {errorMessage && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 w-[90%] bg-rose-500/95 text-white px-4 py-3 rounded-xl text-sm flex items-center gap-2 z-10 backdrop-blur-sm shadow-lg">
          <AlertCircle size={18} /> {errorMessage}
        </div>
      )}
      {roomTime <= 10 && !extendRequested && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-10">
          <button onClick={handleExtend} className="px-8 py-4 bg-gradient-to-r from-rose-400 to-pink-500 text-white rounded-full font-bold shadow-xl animate-bounce flex items-center gap-2">
            <Clock size={20} /> Extend +5:00
          </button>
        </div>
      )}
      {extendRequested && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 text-sm font-bold text-pink-500 bg-white/80 px-4 py-2 rounded-full shadow-sm animate-pulse">
          相手の合意を待っています...
        </div>
      )}

      <div className="p-4 bg-white/90 backdrop-blur-md border-t border-sky-100 shrink-0">
        <form onSubmit={handleSendMessage} className="relative">
          <input
            type="text" value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            placeholder="メッセージを送信..."
            className="w-full bg-sky-50 border border-sky-200 rounded-full py-3.5 pl-5 pr-12 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:bg-white transition"
          />
          <button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2.5 bg-sky-500 text-white rounded-full hover:bg-sky-600 transition shadow-sm">
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

const FadeScreen = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-sky-100 text-slate-500 p-6">
    <div className="w-24 h-24 rounded-full border-4 border-sky-200 border-t-sky-400 animate-spin mb-8"></div>
    <p className="text-xl font-bold tracking-[0.2em] animate-pulse text-sky-600">Fade Out...</p>
    <p className="text-sm mt-4 font-medium">繋がりは空へ溶けていきました</p>
  </div>
);

const WaitingScreen = ({ chatPartner, onCancel }) => (
  <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-sky-500 to-blue-500 text-white p-6">
    <div className="relative mb-6">
      <img src={chatPartner?.avatar} className="w-24 h-24 rounded-full border-4 border-white/60 shadow-xl object-cover" alt="partner" />
      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-white" />
    </div>
    <h3 className="text-xl font-bold mb-1">{chatPartner?.userName}</h3>
    <p className="text-sky-200 text-sm mb-8">({chatPartner?.ageGroup})</p>
    <div className="flex gap-3 mb-8">
      <span className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
    <p className="text-sky-50 font-medium mb-10 text-center">
      相手の応答を待っています...<br />
      <span className="text-sm text-sky-200">波長が合えばSyncが始まります</span>
    </p>
    <button onClick={onCancel} className="px-8 py-3 bg-white/20 rounded-full font-bold border border-white/40 hover:bg-white/30 transition">キャンセル</button>
  </div>
);

// --- メインアプリ ---
const App = () => {
  const [screen, setScreen] = useState('loading');
  const [authUser, setAuthUser] = useState(null);
  const [userProfile, setUserProfile] = useState({ name: '', birthDate: '', gender: '' });

  const [drops, setDrops] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [camera, setCamera] = useState({ x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2 });
  const [scale, setScale] = useState(1);
  const [now, setNow] = useState(Date.now());
  const [myDropText, setMyDropText] = useState('');
  const [myDropCooldown, setMyDropCooldown] = useState(0);
  const [selectedDrop, setSelectedDrop] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [chatPartner, setChatPartner] = useState(null);
  const [roomTime, setRoomTime] = useState(INITIAL_ROOM_TIME);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [extendRequested, setExtendRequested] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [incomingRequest, setIncomingRequest] = useState(null);

  const authUserRef = useRef(null);
  authUserRef.current = authUser;

  // ─── Auth 初期化 ───
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) { setAuthUser(session.user); checkProfile(session.user); }
      else setScreen('login');
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) { setAuthUser(session.user); checkProfile(session.user); }
      else { setAuthUser(null); setScreen('login'); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const checkProfile = async (user) => {
    const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
    if (data) {
      setUserProfile({ name: data.name, birthDate: data.birth_date, gender: data.gender });
      setScreen('space');
    } else {
      // Googleアカウントの名前を初期値に
      setUserProfile(prev => ({ ...prev, name: user.user_metadata?.full_name || '' }));
      setScreen('profile');
    }
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: REDIRECT_URL } });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!authUser) return;
    const { error } = await supabase.from('users').insert({
      id: authUser.id,
      name: userProfile.name,
      birth_date: userProfile.birthDate,
      gender: userProfile.gender,
      avatar_url: authUser.user_metadata?.avatar_url || null,
      is_online: true,
    });
    if (!error) setScreen('space');
    else alert('プロフィール保存に失敗しました: ' + error.message);
  };

  // ─── Drops: 初期ロード + Realtime ───
  useEffect(() => {
    if (screen !== 'space' || !authUser) return;
    let channel;

    const loadDrops = async () => {
      const cutoff = new Date(Date.now() - DROP_LIFETIME).toISOString();
      const { data } = await supabase
        .from('drops')
        .select('*, users(name, avatar_url, is_online, birth_date)')
        .gte('created_at', cutoff);
      if (data) setDrops(data.map(d => toLocalDrop(d, authUser.id)));
    };
    loadDrops();

    channel = supabase.channel('public:drops')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'drops' }, async (payload) => {
        const { data } = await supabase
          .from('drops')
          .select('*, users(name, avatar_url, is_online, birth_date)')
          .eq('id', payload.new.id)
          .single();
        if (data) setDrops(prev => prev.find(d => d.id === data.id) ? prev : [...prev, toLocalDrop(data, authUserRef.current?.id)]);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'drops' }, (payload) => {
        setDrops(prev => prev.filter(d => d.id !== payload.old.id));
      })
      .subscribe();

    // Drop の自動削除タイマー（クライアント側表示制御）
    const timer = setInterval(() => {
      setNow(Date.now());
      setDrops(prev => prev.filter(d => Date.now() - d.createdAt < DROP_LIFETIME));
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(timer);
    };
  }, [screen, authUser]);

  // ─── 着信通知：自分のDropにCatchが来た ───
  useEffect(() => {
    if (!authUser || screen !== 'space') return;

    const channel = supabase.channel(`incoming:${authUser.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rooms', filter: `user1_id=eq.${authUser.id}` },
        async (payload) => {
          const room = payload.new;
          const { data: catcher } = await supabase.from('users').select('*').eq('id', room.user2_id).single();
          if (!catcher) return;
          // 自分の最新Dropのテキスト
          const { data: myDrop } = await supabase.from('drops').select('text').eq('user_id', authUser.id).order('created_at', { ascending: false }).limit(1).single();
          setIncomingRequest({
            partner: {
              userName: catcher.name,
              ageGroup: calculateAgeGroup(catcher.birth_date),
              avatar: catcher.avatar_url || `https://i.pravatar.cc/150?u=${catcher.id}`,
              userId: catcher.id,
            },
            dropText: myDrop?.text || '...',
            roomId: room.id,
          });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [authUser, screen]);

  // ─── Roomメッセージ購読 ───
  useEffect(() => {
    if (screen !== 'room' || !currentRoomId || !authUser) return;

    // 既存メッセージを取得
    supabase.from('messages').select('*').eq('room_id', currentRoomId).order('created_at')
      .then(({ data }) => {
        if (data) setMessages(data.map(m => ({ id: m.id, text: m.text, isMine: m.user_id === authUser.id, isSystem: m.is_system })));
      });

    const channel = supabase.channel(`room:${currentRoomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${currentRoomId}` },
        (payload) => {
          setMessages(prev => {
            if (prev.find(m => m.id === payload.new.id)) return prev;
            return [...prev, { id: payload.new.id, text: payload.new.text, isMine: payload.new.user_id === authUser.id, isSystem: payload.new.is_system }];
          });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [screen, currentRoomId, authUser]);

  // ─── Room タイマー ───
  useEffect(() => {
    if (screen !== 'room' || roomTime <= 0) return;
    const timer = setInterval(() => {
      setRoomTime(prev => {
        if (prev <= 1) { handleFadeOut(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [screen, roomTime]);

  // ─── Drop クールダウン ───
  useEffect(() => {
    if (myDropCooldown > 0) {
      const t = setTimeout(() => setMyDropCooldown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [myDropCooldown]);

  // ─── ハンドラー ───
  const getPositionForDrop = (text, currentDrops, isMine) => {
    const similar = currentDrops.find(d => d.text === text || d.text.includes(text) || text.includes(d.text));
    if (similar) return { x: (similar.x + (Math.random() * 300 - 150) + CANVAS_SIZE) % CANVAS_SIZE, y: (similar.y + (Math.random() * 300 - 150) + CANVAS_SIZE) % CANVAS_SIZE };
    if (isMine) return { x: (camera.x + (Math.random() * 100 - 50) + CANVAS_SIZE) % CANVAS_SIZE, y: (camera.y + (Math.random() * 100 - 50) + CANVAS_SIZE) % CANVAS_SIZE };
    const c = CANVAS_SIZE / 2;
    return { x: (c + (Math.random() * 800 - 400) + CANVAS_SIZE) % CANVAS_SIZE, y: (c + (Math.random() * 800 - 400) + CANVAS_SIZE) % CANVAS_SIZE };
  };

  const handleMyDrop = async (e) => {
    e.preventDefault();
    if (!myDropText.trim() || myDropCooldown > 0 || !authUser) return;
    const pos = getPositionForDrop(myDropText, drops, true);
    const color = `hsla(${Math.random() * 360}, 60%, 90%, 0.9)`;
    const { data, error } = await supabase.from('drops').insert({
      user_id: authUser.id, text: myDropText, color,
      pos_x: pos.x, pos_y: pos.y, anim_type: Math.floor(Math.random() * 3) + 1,
    }).select('*, users(name, avatar_url, is_online, birth_date)').single();
    if (!error && data) {
      setDrops(prev => prev.find(d => d.id === data.id) ? prev : [...prev, toLocalDrop(data, authUser.id)]);
      setMyDropCooldown(60);
      setMyDropText('');
      setCamera({ x: data.pos_x, y: data.pos_y });
    }
  };

  const handleCatch = (drop) => setSelectedDrop(drop);

  const handleDeleteDrop = async (id) => {
    await supabase.from('drops').delete().eq('id', id);
    setDrops(prev => prev.filter(d => d.id !== id));
    setSelectedDrop(null);
  };

  const handleLike = (id) => {
    setDrops(prev => prev.map(d => d.id === id && !d.likedByMe ? { ...d, likes: (d.likes || 0) + 1, likedByMe: true, isPopping: true } : d));
    setSelectedDrop(prev => prev && prev.id === id && !prev.likedByMe ? { ...prev, likes: (prev.likes || 0) + 1, likedByMe: true } : prev);
    setTimeout(() => setDrops(prev => prev.map(d => d.id === id ? { ...d, isPopping: false } : d)), 300);
  };

  const handleBlock = (userName) => {
    setBlockedUsers(prev => [...prev, userName]);
    setSelectedDrop(null);
    alert(`${userName} さんをブロックしました。`);
  };

  const handleReport = () => alert('運営に通報しました。ご協力ありがとうございます。');

  const handleBlockAndExit = (userName) => { handleBlock(userName); handleFadeOut(); };

  const handleSyncRequest = async () => {
    if (!authUser || !selectedDrop) return;
    const expiresAt = new Date(Date.now() + INITIAL_ROOM_TIME * 1000).toISOString();
    const { data: room, error } = await supabase.from('rooms').insert({
      user1_id: selectedDrop.userId,
      user2_id: authUser.id,
      expires_at: expiresAt,
      status: 'active',
    }).select().single();
    if (error) { alert('接続に失敗しました: ' + error.message); return; }
    // システムメッセージを挿入
    await supabase.from('messages').insert({ room_id: room.id, user_id: authUser.id, text: '波長が合いました。5分間のSyncを開始します。', is_system: true });
    setCurrentRoomId(room.id);
    setChatPartner(selectedDrop);
    setScreen('waiting');
    setSelectedDrop(null);
    setTimeout(() => { setScreen('room'); setRoomTime(INITIAL_ROOM_TIME); setMessages([]); }, 2000);
  };

  const handleAcceptRequest = async () => {
    if (!incomingRequest) return;
    setCurrentRoomId(incomingRequest.roomId);
    setChatPartner(incomingRequest.partner);
    setIncomingRequest(null);
    setScreen('room');
    setRoomTime(INITIAL_ROOM_TIME);
    setMessages([]);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !currentRoomId || !authUser) return;
    if (NG_WORDS.some(w => chatInput.toLowerCase().includes(w))) {
      setErrorMessage('送信できない言葉が含まれています。');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    await supabase.from('messages').insert({ room_id: currentRoomId, user_id: authUser.id, text: chatInput, is_system: false });
    setChatInput('');
  };

  const handleFadeOut = () => {
    setScreen('fade');
    setCurrentRoomId(null);
    setChatPartner(null);
    setTimeout(() => { setScreen('space'); setRoomTime(INITIAL_ROOM_TIME); setMessages([]); setExtendRequested(false); }, 1500);
  };

  const handleExtend = () => {
    setExtendRequested(true);
    // 本実装では相手も押したら延長。POCでは1.5秒後に自動延長
    setTimeout(() => { setRoomTime(prev => prev + EXTEND_TIME); setExtendRequested(false); setMessages(prev => [...prev, { id: Date.now(), text: 'システム: 5分間Extendされました✨', isSystem: true }]); }, 1500);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); setScreen('login'); setDrops([]); };

  const handleDeleteAccount = async () => {
    if (!authUser) return;
    await supabase.from('users').delete().eq('id', authUser.id);
    await supabase.auth.signOut();
    setScreen('login');
    setDrops([]);
  };

  const visibleDrops = drops.filter(d => !blockedUsers.includes(d.userName));

  // ─── ローディング ───
  if (screen === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-sky-400 to-sky-200">
        <div className="w-16 h-16 rounded-full border-4 border-white/40 border-t-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="font-sans antialiased max-w-md mx-auto h-screen bg-sky-50 shadow-2xl overflow-hidden relative">
      {screen === 'login'   && <LoginScreen onGoogleLogin={handleGoogleLogin} />}
      {screen === 'profile' && <ProfileScreen userProfile={userProfile} setUserProfile={setUserProfile} onSubmit={handleProfileSubmit} />}
      {screen === 'space'   && (
        <SpaceScreen
          drops={visibleDrops} setDrops={setDrops} camera={camera} setCamera={setCamera} now={now}
          myDropText={myDropText} setMyDropText={setMyDropText} myDropCooldown={myDropCooldown} handleMyDrop={handleMyDrop}
          selectedDrop={selectedDrop} setSelectedDrop={setSelectedDrop} handleCatch={handleCatch}
          handleSyncRequest={handleSyncRequest} handleDeleteDrop={handleDeleteDrop} handleLike={handleLike}
          handleBlock={handleBlock} handleReport={handleReport} setIsSettingsOpen={setIsSettingsOpen}
          scale={scale} setScale={setScale}
        />
      )}
      {screen === 'room'    && (
        <RoomScreen
          roomTime={roomTime} chatPartner={chatPartner} messages={messages}
          chatInput={chatInput} setChatInput={setChatInput}
          handleSendMessage={handleSendMessage} errorMessage={errorMessage}
          handleNext={handleFadeOut} handleExtend={handleExtend} extendRequested={extendRequested}
          handleReport={handleReport} handleBlockAndExit={handleBlockAndExit}
        />
      )}
      {screen === 'fade'    && <FadeScreen />}
      {screen === 'waiting' && <WaitingScreen chatPartner={chatPartner} onCancel={() => { setScreen('space'); setChatPartner(null); setCurrentRoomId(null); }} />}

      {/* 設定モーダル */}
      {isSettingsOpen && (
        <div className="absolute inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">設定・アカウント管理</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-2 transition"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <button onClick={() => { setIsSettingsOpen(false); handleLogout(); }} className="w-full py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition shadow-sm">
                <LogOut size={20} /> ログアウト
              </button>
              <div className="pt-5 mt-5 border-t border-slate-100">
                <p className="text-xs text-slate-400 mb-3 text-center">アカウントを完全に削除します</p>
                <button onClick={() => { if (window.confirm('本当にアカウントを削除しますか？\nすべてのデータが消えます。')) { setIsSettingsOpen(false); handleDeleteAccount(); } }}
                  className="w-full py-4 bg-rose-50 text-rose-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-rose-100 transition shadow-sm border border-rose-100">
                  <Trash2 size={20} /> アカウントを削除（退会）
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 着信リクエスト */}
      {incomingRequest && screen === 'space' && (
        <div className="absolute inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center w-full max-w-sm">
            <div className="relative mb-4">
              <img src={incomingRequest.partner.avatar} className="w-24 h-24 rounded-full border-4 border-sky-100 shadow-inner object-cover" alt="partner" />
              <div className="absolute -bottom-2 -right-2 bg-pink-500 text-white p-2 rounded-full shadow-md animate-bounce"><Heart size={20} /></div>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-1">
              {incomingRequest.partner.userName} <span className="text-sm text-slate-500 font-normal">({incomingRequest.partner.ageGroup})</span>
            </h3>
            <p className="text-slate-600 mb-8 text-center mt-2 font-medium">
              あなたの「{incomingRequest.dropText}」に<br />共感して会話を希望しています！
            </p>
            <div className="flex w-full gap-3">
              <button onClick={() => setIncomingRequest(null)} className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition">見送る</button>
              <button onClick={handleAcceptRequest} className="flex-1 py-3.5 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-2xl font-bold shadow-md hover:opacity-90 transition flex items-center justify-center gap-2">
                <MessageCircle size={20} /> 会話する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
