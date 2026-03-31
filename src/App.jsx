import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Heart, User, LogIn, Send, X, Clock, AlertCircle, Mail, Phone, Twitter, Facebook, Apple, Camera, MoreVertical, Flag, Ban, Settings, Trash2, LogOut } from 'lucide-react';

// --- モックデータ & 定数 ---
const NG_WORDS = ['バカ', '死ね', 'LINE', 'メアド', '@', '.com', 'http', 'sex'];
const INITIAL_ROOM_TIME = 300; // 5分 = 300秒
const EXTEND_TIME = 300;
const CANVAS_SIZE = 3000; // 広大な空のサイズ（このサイズでループする）
const DROP_LIFETIME = 30 * 60 * 1000; // 30分 = 1800000ミリ秒
const MAX_DROPS = 10; // 初期ユーザーが少ない想定で最大10個

const MOCK_AVATARS = [
  'https://i.pravatar.cc/150?u=1',
  'https://i.pravatar.cc/150?u=2',
  'https://i.pravatar.cc/150?u=3',
  'https://i.pravatar.cc/150?u=4',
  'https://i.pravatar.cc/150?u=5',
];

const MOCK_NAMES = ["そら", "K", "Yuki", "名無し", "ハル", "Tomo", "Rin", "Ken"];
const MOCK_AGES = ["10代", "20代", "30代", "40代", "秘密"];

const calculateAgeGroup = (birthDate) => {
  if (!birthDate) return '秘密';
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
  }
  if (age < 10) return '10代未満';
  return `${Math.floor(age / 10) * 10}代`;
};

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

// --- 画面コンポーネント ---

const LoginScreen = ({ onLogin }) => {
  const [agreed, setAgreed] = useState(false);

  const handleLoginClick = () => {
    if (!agreed) {
      alert("アプリを利用するには、利用規約とプライバシーポリシーへの同意が必要です。");
      return;
    }
    onLogin();
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-sky-400 to-sky-200 text-white p-6 relative">
      <h1 className="text-5xl font-bold mb-4 tracking-wider text-white drop-shadow-md">TuneDrop</h1>
      <p className="text-sky-50 mb-8 text-center drop-shadow-sm font-medium">必要最低限で繋がる。<br/>5分で消える、今の思い。</p>
      
      {/* 利用規約同意チェックボックス */}
      <label className="flex items-center gap-3 mb-8 text-sm text-sky-50 bg-black/10 px-5 py-3 rounded-2xl cursor-pointer hover:bg-black/20 transition backdrop-blur-sm border border-white/20 w-full max-w-sm">
        <input 
          type="checkbox" 
          checked={agreed} 
          onChange={e => setAgreed(e.target.checked)} 
          className="w-5 h-5 rounded border-sky-200 text-sky-500 focus:ring-sky-500 bg-white/20 cursor-pointer" 
        />
        <span className="font-medium leading-tight">利用規約とプライバシーポリシーに同意する</span>
      </label>
      
      {/* ブロック状のグリッドレイアウト */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-sm relative">
        {!agreed && <div className="absolute inset-0 z-10 bg-white/5 backdrop-blur-[1px] rounded-3xl" onClick={handleLoginClick}></div>}
        <button onClick={handleLoginClick} className={`col-span-2 py-4 bg-black text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition shadow-lg ${!agreed ? 'opacity-50' : 'hover:bg-slate-800'}`}>
          <Apple size={22} /> Appleでログイン
        </button>
        <button onClick={handleLoginClick} className={`py-4 bg-white text-slate-700 rounded-2xl font-bold flex items-center justify-center gap-2 transition shadow-md ${!agreed ? 'opacity-50' : 'hover:bg-slate-50'}`}>
          <LogIn size={20} /> Google
        </button>
        <button onClick={handleLoginClick} className={`py-4 bg-[#06C755] text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition shadow-md ${!agreed ? 'opacity-50' : 'hover:opacity-90'}`}>
           LINE
        </button>
        <button onClick={handleLoginClick} className={`py-4 bg-black text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition shadow-md ${!agreed ? 'opacity-50' : 'hover:bg-slate-800'}`}>
          <Twitter size={20} /> X
        </button>
        <button onClick={handleLoginClick} className={`py-4 bg-[#1877F2] text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition shadow-md ${!agreed ? 'opacity-50' : 'hover:opacity-90'}`}>
          <Facebook size={20} /> Facebook
        </button>
        <button onClick={handleLoginClick} className={`py-4 bg-sky-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition shadow-md ${!agreed ? 'opacity-50' : 'hover:bg-sky-600'}`}>
          <Phone size={20} /> 電話
        </button>
        <button onClick={handleLoginClick} className={`py-4 bg-slate-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition shadow-md ${!agreed ? 'opacity-50' : 'hover:bg-slate-600'}`}>
          <Mail size={20} /> メール
        </button>
      </div>
    </div>
  );
};

const ProfileScreen = ({ userProfile, setUserProfile, onSubmit }) => (
  <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-sky-400 to-sky-200 text-white p-6">
    <h2 className="text-2xl font-bold mb-6 drop-shadow-md">あなたについて教えてください</h2>
    <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 bg-white/20 p-6 rounded-2xl backdrop-blur-md shadow-lg">
      <div className="flex flex-col items-center mb-4">
        <div className="w-24 h-24 bg-sky-100 rounded-full flex items-center justify-center text-sky-400 mb-2 border-4 border-white shadow-sm overflow-hidden relative cursor-pointer hover:bg-sky-200 transition">
          <Camera size={32} />
          <span className="absolute bottom-2 text-[10px] font-bold">写真を選択</span>
        </div>
      </div>
      
      <div>
        <label className="block text-sm text-sky-50 mb-1 font-medium">名前 (ニックネームOK)</label>
        <input 
          type="text" 
          required
          className="w-full bg-white/90 border-none rounded-lg p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400 shadow-inner"
          value={userProfile.name}
          onChange={e => setUserProfile({...userProfile, name: e.target.value})}
          placeholder="そら太郎"
        />
      </div>

      <div>
        <label className="block text-sm text-sky-50 mb-1 font-medium">生年月日</label>
        <input 
          type="date" 
          required
          className="w-full bg-white/90 border-none rounded-lg p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400 shadow-inner"
          value={userProfile.birthDate}
          onChange={e => setUserProfile({...userProfile, birthDate: e.target.value})}
        />
      </div>

      <div>
        <label className="block text-sm text-sky-50 mb-1 font-medium">性別</label>
        <select 
          required
          className="w-full bg-white/90 border-none rounded-lg p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400 shadow-inner"
          value={userProfile.gender}
          onChange={e => setUserProfile({...userProfile, gender: e.target.value})}
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

const SpaceScreen = ({
  drops, setDrops, camera, setCamera, now,
  myDropText, setMyDropText, myDropCooldown, handleMyDrop,
  selectedDrop, setSelectedDrop, handleCatch, handleSyncRequest, handleDeleteDrop, handleLike,
  handleBlock, handleReport, setIsSettingsOpen,
  scale, setScale
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [draggingDropId, setDraggingDropId] = useState(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const initialDistRef = useRef(null);
  const clickStartRef = useRef({ x: 0, y: 0 });
  const [showMenu, setShowMenu] = useState(false);
  const canvasContainerRef = useRef(null);

  // ポップアップが変わったらメニューを閉じる
  useEffect(() => { setShowMenu(false); }, [selectedDrop]);

  // ピンチズーム：passive: false で addEventListener してブラウザ独自ズームを防ぐ
  useEffect(() => {
    const el = canvasContainerRef.current;
    if (!el) return;

    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        initialDistRef.current = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    };

    const onTouchMove = (e) => {
      if (e.touches.length === 2 && initialDistRef.current) {
        e.preventDefault();
        const currentDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const ratio = currentDist / initialDistRef.current;
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;

        setScale(prev => {
          const newScale = Math.min(Math.max(0.3, prev * ratio), 2.5);
          // ピンチ中心点に向かってカメラを調整
          setCamera(cam => ({
            x: ((cam.x + (midX - cx) * (1 / prev - 1 / newScale)) + CANVAS_SIZE) % CANVAS_SIZE,
            y: ((cam.y + (midY - cy) * (1 / prev - 1 / newScale)) + CANVAS_SIZE) % CANVAS_SIZE,
          }));
          return newScale;
        });
        initialDistRef.current = currentDist;
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  // ズーム処理 (マウスホイール) - カーソル位置に向かってズーム
  const handleWheel = (e) => {
    e.preventDefault();
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    setScale(prev => {
      const newScale = Math.min(Math.max(0.3, prev - e.deltaY * 0.001), 2.5);
      setCamera(cam => ({
        x: ((cam.x + (e.clientX - cx) * (1 / prev - 1 / newScale)) + CANVAS_SIZE) % CANVAS_SIZE,
        y: ((cam.y + (e.clientY - cy) * (1 / prev - 1 / newScale)) + CANVAS_SIZE) % CANVAS_SIZE,
      }));
      return newScale;
    });
  };

  // ドラッグ処理 (空間のパン ＆ Tuneの移動)
  const handlePointerDown = (e) => {
    setIsDragging(true);
    setStartPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e) => {
    if (draggingDropId) {
      // 特定のTuneを動かしている場合
      const dx = (e.clientX - startPos.x) / scale;
      const dy = (e.clientY - startPos.y) / scale;
      
      setDrops(prev => prev.map(d => {
        if (d.id === draggingDropId) {
          return {
            ...d,
            x: (d.x + dx + CANVAS_SIZE) % CANVAS_SIZE,
            y: (d.y + dy + CANVAS_SIZE) % CANVAS_SIZE
          };
        }
        return d;
      }));
      setStartPos({ x: e.clientX, y: e.clientY });
    } else if (isDragging) {
      // 空間全体を動かしている場合
      const dx = (e.clientX - startPos.x) / scale;
      const dy = (e.clientY - startPos.y) / scale;
      
      setCamera(prev => ({
        x: ((prev.x - dx) % CANVAS_SIZE + CANVAS_SIZE) % CANVAS_SIZE,
        y: ((prev.y - dy) % CANVAS_SIZE + CANVAS_SIZE) % CANVAS_SIZE
      }));
      setStartPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handlePointerUp = (e) => {
    if (draggingDropId) {
      // Tuneのドラッグ終了。ほとんど動かしていなければ「タップ（Catch）」として扱う
      const drop = drops.find(d => d.id === draggingDropId);
      const dist = Math.hypot(e.clientX - clickStartRef.current.x, e.clientY - clickStartRef.current.y);
      if (dist < 10 && drop) { 
        handleCatch(drop);
      }
      setDraggingDropId(null);
    }
    setIsDragging(false);
    initialDistRef.current = null;
  };

  // Tuneに触れた時のイベント
  const onDropPointerDown = (e, drop) => {
    e.stopPropagation(); // 空間全体のドラッグを防止
    setDraggingDropId(drop.id);
    setStartPos({ x: e.clientX, y: e.clientY });
    clickStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const stopPropagation = (e) => e.stopPropagation();

  return (
    <div className="relative h-screen w-full bg-gradient-to-b from-sky-400 via-sky-300 to-sky-100 overflow-hidden">
      
      {/* アニメーションを修正：translate(-50%, -50%) を維持したまま揺らす */}
      <style>{`
        @keyframes float1 { 0%, 100% { transform: translate(-50%, -50%); } 50% { transform: translate(calc(-50% + 15px), calc(-50% - 20px)); } }
        @keyframes float2 { 0%, 100% { transform: translate(-50%, -50%); } 50% { transform: translate(calc(-50% - 20px), calc(-50% - 10px)); } }
        @keyframes float3 { 0%, 100% { transform: translate(-50%, -50%); } 50% { transform: translate(calc(-50% + 10px), calc(-50% - 30px)); } }
        @keyframes flash { 0% { opacity: 0.6; } 100% { opacity: 0; } }
      `}</style>

      {/* 設定ボタン */}
      <button 
        onClick={() => setIsSettingsOpen(true)} 
        className="absolute top-6 right-6 z-40 p-3 bg-white/40 backdrop-blur-md border border-white/60 rounded-full text-slate-700 hover:bg-white/60 transition shadow-sm"
      >
        <Settings size={22} />
      </button>

      {/* ドラッグ＆ズーム操作を受け付ける背景レイヤー */}
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
        <div 
          className="absolute inset-0 origin-center"
          style={{
            transform: `scale(${scale})`,
            transition: isDragging || draggingDropId ? 'none' : 'transform 0.15s ease-out'
          }}
        >
          {drops.map(drop => {
            const age = now - drop.createdAt;
            const lifeRatio = Math.max(0, 1 - age / DROP_LIFETIME);
            // 残り5%（約1.5分）から徐々に透明になる
            const opacity = lifeRatio > 0.05 ? 1 : lifeRatio * 20;

            const likes = drop.likes || 0;
            // いいねされた瞬間だけ1.2倍になり、普段は等倍(1)に戻る
            const dropScale = drop.isPopping ? 1.2 : 1; 
            const glowShadow = likes > 0 
              ? `0 0 ${15 + likes * 10}px ${drop.color}, inset 0 0 10px rgba(255,255,255,0.8)` 
              : `0 8px 32px rgba(255,255,255,0.4)`;
            const borderColor = likes > 0 ? drop.color : 'rgba(255,255,255,0.7)';
            
            // ドラッグ中かどうか
            const isBeingDragged = draggingDropId === drop.id;

            // --- 地球儀ループ計算 ---
            let dx = (drop.x - camera.x) % CANVAS_SIZE;
            if (dx > CANVAS_SIZE / 2) dx -= CANVAS_SIZE;
            if (dx < -CANVAS_SIZE / 2) dx += CANVAS_SIZE;
            
            let dy = (drop.y - camera.y) % CANVAS_SIZE;
            if (dy > CANVAS_SIZE / 2) dy -= CANVAS_SIZE;
            if (dy < -CANVAS_SIZE / 2) dy += CANVAS_SIZE;

            const cx = typeof window !== 'undefined' ? window.innerWidth / 2 : 200;
            const cy = typeof window !== 'undefined' ? window.innerHeight / 2 : 400;
            const displayX = cx + dx;
            const displayY = cy + dy;

            return (
              <div 
                key={drop.id}
                onPointerDown={(e) => onDropPointerDown(e, drop)}
                className="absolute flex flex-col items-center justify-center cursor-pointer group"
                style={{
                  left: `${displayX}px`,
                  top: `${displayY}px`,
                  opacity: opacity,
                  // ドラッグ中はアニメーションを停止し、最前面に表示
                  animation: isBeingDragged ? 'none' : `float${drop.animType} ${4 + drop.animType}s ease-in-out infinite`,
                  animationDelay: isBeingDragged ? '0s' : `${drop.animDelay}s`,
                  zIndex: isBeingDragged ? 50 : 10
                }}
              >
                <div 
                  className={`flex items-center gap-3 p-2 pr-6 rounded-full bg-white/40 backdrop-blur-md transition-all duration-300 ease-out group-hover:bg-white/60 ${isBeingDragged ? 'ring-2 ring-white/50 scale-105' : ''}`}
                  style={{
                    transform: `scale(${dropScale})`,
                    boxShadow: glowShadow,
                    border: `2px solid ${borderColor}`
                  }}
                >
                  <div className="relative">
                    <img src={drop.avatar} alt="avatar" className="w-12 h-12 rounded-full border-2 border-white object-cover shadow-sm pointer-events-none" draggable="false" />
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${drop.isOnline ? 'bg-green-500' : 'bg-slate-400'}`}></span>
                  </div>
                  <span className="text-base font-bold whitespace-nowrap text-slate-700 drop-shadow-sm pointer-events-none">{drop.text}</span>
                  
                  {likes > 0 && (
                    <span className="flex items-center gap-1 text-pink-500 text-sm font-bold ml-1 drop-shadow-sm pointer-events-none">
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

      {/* Catch Menu Popup */}
      {selectedDrop && (
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-md p-6 rounded-3xl shadow-2xl z-50 flex flex-col items-center min-w-[280px]"
          onPointerDown={stopPropagation}
          onPointerMove={stopPropagation}
          onPointerUp={stopPropagation}
        >
          <button className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1" onClick={() => setSelectedDrop(null)}><X size={20}/></button>
          
          {/* 通報・ブロックメニュー */}
          {!selectedDrop.isMine && (
             <div className="absolute top-4 left-4">
               <button className="text-slate-400 hover:text-slate-600 p-1" onClick={() => setShowMenu(!showMenu)}>
                 <MoreVertical size={20}/>
               </button>
               {showMenu && (
                 <div className="absolute top-8 left-0 bg-white shadow-xl rounded-xl py-2 w-44 z-50 border border-slate-100">
                   <button onClick={handleReport} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 font-medium"><Flag size={16}/> 通報する</button>
                   <button onClick={() => handleBlock(selectedDrop.userName)} className="w-full text-left px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-3 font-medium"><Ban size={16}/> ブロックする</button>
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
            <div className="flex w-full gap-3">
              <button onClick={() => handleDeleteDrop(selectedDrop.id)} className="flex-1 py-3.5 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center gap-2 hover:bg-rose-100 transition font-bold shadow-sm">
                Dropを取り消す
              </button>
            </div>
          ) : (
            <div className="flex w-full gap-3">
              <button 
                onClick={() => handleLike(selectedDrop.id)} 
                disabled={selectedDrop.likedByMe}
                className={`flex-1 py-3.5 rounded-2xl flex items-center justify-center gap-2 transition font-bold shadow-sm ${selectedDrop.likedByMe ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-pink-50 text-pink-500 hover:bg-pink-100'}`}
              >
                <Heart size={20} className={selectedDrop.likedByMe ? "text-slate-400" : ""} fill={selectedDrop.likedByMe ? "currentColor" : "none"} /> 
                {selectedDrop.likedByMe ? 'いいね済み' : 'いいね'}
              </button>
              <button 
                onClick={handleSyncRequest} 
                disabled={!selectedDrop.isOnline}
                className={`flex-1 py-3.5 rounded-2xl flex items-center justify-center gap-2 font-bold shadow-md transition ${selectedDrop.isOnline ? 'bg-gradient-to-r from-sky-500 to-blue-500 text-white hover:opacity-90' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
              >
                <MessageCircle size={20} /> {selectedDrop.isOnline ? '会話する' : 'オフライン'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Drop Input UI */}
      <div 
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-[90%] max-w-md z-40"
        onPointerDown={stopPropagation}
        onPointerMove={stopPropagation}
        onPointerUp={stopPropagation}
      >
        <form onSubmit={handleMyDrop} className="relative">
          <input 
            name="dropText"
            type="text" 
            value={myDropText}
            onChange={(e) => setMyDropText(e.target.value)}
            placeholder={myDropCooldown > 0 ? `次のDropまで ${myDropCooldown}秒...` : "今の気持ちをDropする..."}
            disabled={myDropCooldown > 0}
            className="w-full bg-white/80 border-2 border-white backdrop-blur-md rounded-full py-4 pl-6 pr-14 text-slate-800 placeholder-slate-500 focus:outline-none focus:bg-white shadow-lg disabled:opacity-70"
            maxLength={30}
          />
          <button 
            type="submit" 
            disabled={myDropCooldown > 0}
            className="absolute right-2 top-2 bottom-2 aspect-square bg-sky-500 text-white rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-sky-600 transition shadow-sm"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

const RoomScreen = ({
  roomTime, chatPartner, messages, chatInput, setChatInput,
  handleSendMessage, errorMessage, handleNext, handleExtend, extendRequested,
  handleReport, handleBlockAndExit
}) => {
  const [showRoomMenu, setShowRoomMenu] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-sky-50 text-slate-800 relative">
      <div className="flex items-center justify-between p-4 bg-white/90 backdrop-blur-md border-b border-sky-100 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <img src={chatPartner?.avatar || 'https://i.pravatar.cc/150?u=me'} alt="avatar" className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover" />
          <div className="flex flex-col">
            <span className="font-bold text-slate-700">{chatPartner?.userName || '匿名'}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 font-mono text-xl font-bold ${roomTime <= 10 ? 'text-rose-500 animate-pulse' : 'text-sky-500'}`}>
            <Clock size={20} />
            {formatTime(roomTime)}
          </div>
          <button onClick={handleNext} className="text-sm px-4 py-2 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-full transition font-bold ml-2">
            Next
          </button>
          
          <div className="relative ml-1">
            <button onClick={() => setShowRoomMenu(!showRoomMenu)} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full transition">
              <MoreVertical size={20} />
            </button>
            {showRoomMenu && (
              <div className="absolute top-12 right-0 bg-white shadow-2xl rounded-xl py-2 w-48 z-50 border border-slate-100">
                <button onClick={() => { handleReport(); setShowRoomMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 font-medium"><Flag size={18}/> 通報する</button>
                <button onClick={() => { handleBlockAndExit(chatPartner?.userName); setShowRoomMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-3 font-medium"><Ban size={18}/> ブロックして退出</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-sky-100 to-sky-50 pb-20">
        {messages.map((msg, i) => (
          <div key={msg.id} className={`flex ${msg.isSystem ? 'justify-center' : msg.isMine ? 'justify-end' : 'justify-start'}`}>
            {msg.isSystem ? (
              <span className="text-xs text-slate-500 bg-white/60 px-4 py-1.5 rounded-full font-medium shadow-sm">{msg.text}</span>
            ) : (
              <div className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-sm text-sm ${msg.isMine ? 'bg-sky-500 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none'}`}>
                {msg.text}
              </div>
            )}
          </div>
        ))}
      </div>

      {errorMessage && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 w-[90%] bg-rose-500/95 text-white px-4 py-3 rounded-xl text-sm flex items-center gap-2 z-10 backdrop-blur-sm shadow-lg">
          <AlertCircle size={18} /> {errorMessage}
        </div>
      )}

      {roomTime <= 10 && !extendRequested && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-10">
          <button 
            onClick={handleExtend}
            className="px-8 py-4 bg-gradient-to-r from-rose-400 to-pink-500 text-white rounded-full font-bold shadow-xl shadow-pink-500/30 animate-bounce flex items-center gap-2"
          >
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
            type="text" 
            value={chatInput}
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
  <div className="flex flex-col items-center justify-center h-screen bg-sky-100 text-slate-500 p-6 transition-opacity duration-500">
    <div className="w-24 h-24 rounded-full border-4 border-sky-200 border-t-sky-400 animate-spin mb-8"></div>
    <p className="text-xl font-bold tracking-[0.2em] animate-pulse text-sky-600">Fade Out...</p>
    <p className="text-sm mt-4 font-medium">繋がりは空へ溶けていきました</p>
  </div>
);

// --- メインアプリケーション ---

const App = () => {
  const [screen, setScreen] = useState('login');
  const [userProfile, setUserProfile] = useState({ name: '', birthDate: '', gender: '', avatar: null });
  const [drops, setDrops] = useState([]);
  const [myDropCooldown, setMyDropCooldown] = useState(0);
  const [myDropText, setMyDropText] = useState('');
  
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const visibleDrops = drops.filter(drop => !blockedUsers.includes(drop.userName));
  
  // 地球儀ループ用のカメラ中心座標とスケール(ズーム)
  const [camera, setCamera] = useState({ x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2 });
  const [scale, setScale] = useState(1);
  const [now, setNow] = useState(Date.now());

  const [roomTime, setRoomTime] = useState(INITIAL_ROOM_TIME);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatPartner, setChatPartner] = useState(null);
  const [extendRequested, setExtendRequested] = useState(false);
  const [partnerExtendRequested, setPartnerExtendRequested] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [incomingRequest, setIncomingRequest] = useState(null);
  const [flash, setFlash] = useState(false);
  const [selectedDrop, setSelectedDrop] = useState(null);

  const getPositionForDrop = (text, currentDrops, isMine) => {
    const similarDrop = currentDrops.find(d => d.text === text || d.text.includes(text) || text.includes(d.text));
    
    if (similarDrop) {
      return {
        x: (similarDrop.x + (Math.random() * 300 - 150) + CANVAS_SIZE) % CANVAS_SIZE,
        y: (similarDrop.y + (Math.random() * 300 - 150) + CANVAS_SIZE) % CANVAS_SIZE
      };
    }
    
    if (isMine) {
      // 自分のDropは現在のカメラ位置（画面中央）周辺に出現
      return {
        x: (camera.x + (Math.random() * 100 - 50) + CANVAS_SIZE) % CANVAS_SIZE,
        y: (camera.y + (Math.random() * 100 - 50) + CANVAS_SIZE) % CANVAS_SIZE
      };
    }
    
    const center = CANVAS_SIZE / 2;
    return {
      x: (center + (Math.random() * 800 - 400) + CANVAS_SIZE) % CANVAS_SIZE,
      y: (center + (Math.random() * 800 - 400) + CANVAS_SIZE) % CANVAS_SIZE
    };
  };

  const createMockDrop = (currentDrops) => {
    const mockTexts = ["眠れないな", "Vaundy最高", "明日仕事行きたくない", "映画みたい", "お腹すいた", "夜風が気持ちいい", "誰か話そう", "星が綺麗"];
    const text = mockTexts[Math.floor(Math.random() * mockTexts.length)];
    const pos = getPositionForDrop(text, currentDrops, false);

    return {
      id: Date.now() + Math.random(),
      text: text,
      userName: MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)],
      ageGroup: MOCK_AGES[Math.floor(Math.random() * MOCK_AGES.length)],
      avatar: MOCK_AVATARS[Math.floor(Math.random() * MOCK_AVATARS.length)],
      color: `hsla(${Math.random() * 360}, 60%, 90%, 0.9)`, 
      x: pos.x,
      y: pos.y,
      animType: Math.floor(Math.random() * 3) + 1,
      animDelay: Math.random() * -5,
      isMine: false,
      isOnline: Math.random() > 0.4, 
      likes: 0,
      likedByMe: false,
      createdAt: Date.now() - Math.random() * (DROP_LIFETIME * 0.8) 
    };
  };

  const dropsRef = useRef(drops);
  useEffect(() => {
    dropsRef.current = drops;
  }, [drops]);

  useEffect(() => {
    if (screen === 'space') {
      setDrops(prev => {
        if (prev.length === 0) {
          let initialDrops = [];
          for(let i=0; i<MAX_DROPS; i++) {
            initialDrops.push(createMockDrop(initialDrops));
          }
          return initialDrops;
        }
        return prev;
      });
      const interval = setInterval(() => {
        setDrops(prev => {
          if (prev.length >= MAX_DROPS) return prev;
          return [...prev, createMockDrop(prev)];
        });
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [screen]);

  useEffect(() => {
    if (screen === 'space') {
      const interval = setInterval(() => {
        setNow(Date.now());
        setDrops(prev => prev.filter(drop => Date.now() - drop.createdAt < DROP_LIFETIME));
      }, 100);
      return () => clearInterval(interval);
    }
  }, [screen]);

  useEffect(() => {
    if (screen === 'space') {
      const interval = setInterval(() => {
        const currentDrops = dropsRef.current;
        const myDrops = currentDrops.filter(d => d.isMine);
        
        if (myDrops.length > 0 && Math.random() < 0.15) { 
          const targetDrop = myDrops[Math.floor(Math.random() * myDrops.length)];
          
          setFlash(true);
          setTimeout(() => setFlash(false), 800);
          
          // isPoppingフラグを立ててアニメーション開始
          setDrops(prev => prev.map(d => d.id === targetDrop.id ? { ...d, likes: (d.likes || 0) + 1, isPopping: true } : d));
          
          // 300ms後にフラグを戻して元のサイズへ
          setTimeout(() => {
            setDrops(prev => prev.map(d => d.id === targetDrop.id ? { ...d, isPopping: false } : d));
          }, 300);
        }
      }, 5000); 
      return () => clearInterval(interval);
    }
  }, [screen]);

  useEffect(() => {
    if (myDropCooldown > 0) {
      const timer = setTimeout(() => setMyDropCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [myDropCooldown]);

  useEffect(() => {
    if (screen === 'room' && roomTime > 0) {
      const timer = setInterval(() => {
        setRoomTime(prev => {
          if (prev <= 1) {
            handleFadeOut();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [screen, roomTime]);

  useEffect(() => {
    if (extendRequested && partnerExtendRequested) {
      setRoomTime(prev => prev + EXTEND_TIME);
      setExtendRequested(false);
      setPartnerExtendRequested(false);
      setMessages(prev => [...prev, { id: Date.now(), text: "システム: 5分間Extendされました✨", isSystem: true }]);
    }
  }, [extendRequested, partnerExtendRequested]);


  const handleLogin = () => setScreen('profile');
  
  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setScreen('space');
  };

  const handleMyDrop = (e) => {
    e.preventDefault();
    if (!myDropText.trim() || myDropCooldown > 0) return;

    const pos = getPositionForDrop(myDropText, drops, true);

    const newDrop = {
      id: Date.now(),
      text: myDropText,
      userName: userProfile.name || '匿名',
      ageGroup: calculateAgeGroup(userProfile.birthDate),
      avatar: userProfile.avatar || 'https://i.pravatar.cc/150?u=me',
      color: 'rgba(255, 255, 255, 0.9)',
      x: pos.x,
      y: pos.y,
      animType: 1,
      animDelay: 0,
      isMine: true,
      isOnline: true,
      likes: 0,
      likedByMe: false,
      createdAt: Date.now()
    };
    
    // 同じ言葉がある場所に引っ張られた場合、そこへカメラをシームレスにジャンプさせる
    let dx = (pos.x - camera.x) % CANVAS_SIZE;
    if (dx > CANVAS_SIZE / 2) dx -= CANVAS_SIZE;
    if (dx < -CANVAS_SIZE / 2) dx += CANVAS_SIZE;
    
    let dy = (pos.y - camera.y) % CANVAS_SIZE;
    if (dy > CANVAS_SIZE / 2) dy -= CANVAS_SIZE;
    if (dy < -CANVAS_SIZE / 2) dy += CANVAS_SIZE;

    const w = typeof window !== 'undefined' ? window.innerWidth : 400;
    const h = typeof window !== 'undefined' ? window.innerHeight : 800;
    const isNearby = Math.abs(dx) < w / 2 && Math.abs(dy) < h / 2;
    if (!isNearby) {
       setCamera({ x: pos.x, y: pos.y });
    }

    setDrops(prev => [...prev, newDrop]);
    setMyDropCooldown(60); 
    setMyDropText(''); 

    setTimeout(() => {
      setIncomingRequest({
        partner: {
          userName: MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)],
          ageGroup: MOCK_AGES[Math.floor(Math.random() * MOCK_AGES.length)],
          avatar: MOCK_AVATARS[Math.floor(Math.random() * MOCK_AVATARS.length)],
        },
        dropText: newDrop.text
      });
    }, 5000);
  };

  const handleCatch = (drop) => {
    setSelectedDrop(drop);
  };

  const handleDeleteDrop = (id) => {
    setDrops(prev => prev.filter(d => d.id !== id));
    setSelectedDrop(null);
  };

  const handleLike = (id) => {
    setDrops(prev => prev.map(d => {
      if (d.id === id && !d.likedByMe) {
        return { ...d, likes: (d.likes || 0) + 1, likedByMe: true, isPopping: true };
      }
      return d;
    }));
    
    // 300ms後にフラグを戻して元のサイズへ
    setTimeout(() => {
      setDrops(prev => prev.map(d => d.id === id ? { ...d, isPopping: false } : d));
    }, 300);
  };

  const handleBlock = (userName) => {
    setBlockedUsers(prev => [...prev, userName]);
    alert(`${userName} さんをブロックしました。\n今後、このユーザーのTuneは表示されません。`);
  };

  const handleReport = () => {
    alert("運営に通報しました。\n安心・安全な環境維持にご協力ありがとうございます。");
  };

  const handleBlockAndExit = (userName) => {
    handleBlock(userName);
    handleNext(); 
  };

  const handleLogout = () => {
    setScreen('login');
  };

  const handleDeleteAccount = () => {
    setScreen('login');
    setUserProfile({ name: '', birthDate: '', gender: '', avatar: null });
    setDrops([]);
    setBlockedUsers([]);
    alert("アカウントを削除し、退会処理が完了しました。\nご利用ありがとうございました。");
  };

  const handleSyncRequest = () => {
    setChatPartner(selectedDrop);
    setScreen('room');
    setRoomTime(INITIAL_ROOM_TIME);
    setMessages([{ id: Date.now(), text: "波長が合いました。5分間のSyncを開始します。", isSystem: true }]);
    setSelectedDrop(null);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const isNG = NG_WORDS.some(word => chatInput.toLowerCase().includes(word));
    if (isNG) {
      setErrorMessage("送信できない言葉が含まれています。連絡先の交換等は禁止されています。");
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setMessages(prev => [...prev, { id: Date.now(), text: chatInput, isMine: true }]);
    setChatInput('');

    setTimeout(() => {
      if (screen === 'room') {
        setMessages(prev => [...prev, { id: Date.now(), text: "共感します！", isMine: false }]);
      }
    }, 2000);
  };

  const handleFadeOut = () => {
    setScreen('fade');
    setTimeout(() => {
      setScreen('space');
      setRoomTime(INITIAL_ROOM_TIME);
      setMessages([]);
      setExtendRequested(false);
      setPartnerExtendRequested(false);
    }, 1500); 
  };

  const handleNext = () => handleFadeOut();

  const handleExtend = () => {
    setExtendRequested(true);
    setTimeout(() => {
      setPartnerExtendRequested(true);
    }, 1500);
  };

  const handleAcceptRequest = () => {
    setChatPartner(incomingRequest.partner);
    setScreen('room');
    setRoomTime(INITIAL_ROOM_TIME);
    setMessages([{ id: Date.now(), text: "波長が合いました。5分間のSyncを開始します。", isSystem: true }]);
    setIncomingRequest(null);
  };

  return (
    <div className="font-sans antialiased max-w-md mx-auto h-screen bg-sky-50 shadow-2xl overflow-hidden relative">
      {screen === 'login' && <LoginScreen onLogin={handleLogin} />}
      {screen === 'profile' && <ProfileScreen userProfile={userProfile} setUserProfile={setUserProfile} onSubmit={handleProfileSubmit} />}
      {screen === 'space' && (
        <SpaceScreen 
          drops={visibleDrops} setDrops={setDrops} camera={camera} setCamera={setCamera} now={now} 
          myDropText={myDropText} setMyDropText={setMyDropText} myDropCooldown={myDropCooldown} handleMyDrop={handleMyDrop} 
          selectedDrop={selectedDrop} setSelectedDrop={setSelectedDrop} handleCatch={handleCatch} handleSyncRequest={handleSyncRequest} 
          handleDeleteDrop={handleDeleteDrop} handleLike={handleLike}
          handleBlock={handleBlock} handleReport={handleReport} setIsSettingsOpen={setIsSettingsOpen}
          scale={scale} setScale={setScale}
        />
      )}
      {screen === 'room' && (
        <RoomScreen 
          roomTime={roomTime} chatPartner={chatPartner} messages={messages} chatInput={chatInput} setChatInput={setChatInput} 
          handleSendMessage={handleSendMessage} errorMessage={errorMessage} handleNext={handleNext} handleExtend={handleExtend} extendRequested={extendRequested} 
          handleReport={handleReport} handleBlockAndExit={handleBlockAndExit}
        />
      )}
      {screen === 'fade' && <FadeScreen />}

      {/* 設定・アカウント管理モーダル */}
      {isSettingsOpen && (
        <div className="absolute inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">設定・アカウント管理</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-2 transition"><X size={20}/></button>
            </div>
            
            <div className="space-y-3">
              <button onClick={() => { setIsSettingsOpen(false); handleLogout(); }} className="w-full py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition shadow-sm">
                <LogOut size={20} /> ログアウト
              </button>

              <div className="pt-5 mt-5 border-t border-slate-100">
                <p className="text-xs text-slate-400 mb-3 text-center">Appleガイドライン必須機能</p>
                <button onClick={() => {
                   if(window.confirm("本当にアカウントを完全に削除しますか？\nこれまでのデータはすべて失われ、復元できません。")) {
                      setIsSettingsOpen(false);
                      handleDeleteAccount();
                   }
                }} className="w-full py-4 bg-rose-50 text-rose-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-rose-100 transition shadow-sm border border-rose-100">
                  <Trash2 size={20}/> アカウントを削除（退会）
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 画面フラッシュ演出 */}
      {flash && screen === 'space' && (
        <div className="absolute inset-0 z-[110] pointer-events-none bg-white mix-blend-overlay animate-[flash_0.8s_ease-out_forwards]" />
      )}

      {/* 相手からの会話リクエストポップアップ */}
      {incomingRequest && screen === 'space' && (
        <div className="absolute inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center w-full max-w-sm">
            <div className="relative mb-4">
              <img src={incomingRequest.partner.avatar} className="w-24 h-24 rounded-full border-4 border-sky-100 shadow-inner object-cover" alt="partner" />
              <div className="absolute -bottom-2 -right-2 bg-pink-500 text-white p-2 rounded-full shadow-md animate-bounce">
                <Heart size={20} />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-1">{incomingRequest.partner.userName} <span className="text-sm text-slate-500 font-normal">({incomingRequest.partner.ageGroup})</span></h3>
            <p className="text-slate-600 mb-8 text-center mt-2 font-medium">あなたの「{incomingRequest.dropText}」に<br/>共感して会話を希望しています！</p>
            
            <div className="flex w-full gap-3">
              <button onClick={() => setIncomingRequest(null)} className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition">
                見送る
              </button>
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