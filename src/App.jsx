import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, MessageCircle, Settings, X, Heart, Flag, Ban, MoreVertical, 
  Send, Clock, LogOut, CheckCircle, Trash2, Edit2, LogIn, Wind,
  DoorOpen, AlertCircle
} from 'lucide-react';
import { supabase } from './lib/supabase';

// --- 定数 ---
const NG_WORDS = ['バカ', '死ね', 'LINE', 'メアド', '@', '.com', 'http', 'sex'];
const INITIAL_ROOM_TIME = 300;
const EXTEND_TIME = 300;
const CANVAS_SIZE = 5000;
const MAX_DROPS = 500;
// Drop寿命を 30分 に制限（ユーザーフィードバックによりウザさを解消）
const DROP_LIFETIME = 30 * 60 * 1000;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

const REDIRECT_URL = 'https://oyajibuki.github.io/TuneDrop/';

// --- 仮想ユーザー（Bot）定義 ---
const BOT_USERS = [
  { id: 'bot-1', name: 'そら', ageGroup: '20代', avatar: 'https://i.pravatar.cc/150?u=bot-sora' },
  { id: 'bot-2', name: 'りく', ageGroup: '30代', avatar: 'https://i.pravatar.cc/150?u=bot-riku' },
  { id: 'bot-3', name: 'みお', ageGroup: '20代', avatar: 'https://i.pravatar.cc/150?u=bot-mio' },
  { id: 'bot-4', name: 'あお', ageGroup: '10代', avatar: 'https://i.pravatar.cc/150?u=bot-ao' },
  { id: 'bot-5', name: 'ゆう', ageGroup: '30代', avatar: 'https://i.pravatar.cc/150?u=bot-yuu' },
  { id: 'bot-6', name: 'うみ', ageGroup: '20代', avatar: 'https://i.pravatar.cc/150?u=bot-umi' },
  { id: 'bot-7', name: 'はな', ageGroup: '40代', avatar: 'https://i.pravatar.cc/150?u=bot-hana' },
  { id: 'bot-8', name: 'かい', ageGroup: '30代', avatar: 'https://i.pravatar.cc/150?u=bot-kai' },
];
const BOT_DROP_TEXTS = [
  '眠れない','Vaundy聴いてる','なんか虚無','コーヒー飲みたい','映画みたい','誰かと話したい',
  '夜が好き','最近つかれてる','明日やる気ない','空腹','雨の音が好き','一人の時間大切',
  '急に泣きそう','懐かしい気分','ご飯何食べよう','何もしたくない','散歩したい','星みたい',
  'ぼーっとしてた','最近よく夢みる','好きな曲きいてる','ねむい','焦ってる','何かしなきゃと思ってる',
  'もやもやしてる','だれかいる?','今日調子よかった','笑いたい','久しぶりに連絡したい人いる',
  'アイス食べたい','夜風気持ちいい','ゲームしたい','なんか前向きな気分','読書したい','料理してた',
  'お風呂あがり','一人でいると考えすぎる','明日も頑張れるか不安','ちょっと孤独感ある',
  '音楽にすくわれてる','どこかいきたい','ぼんやりしてる','なんかいいことあった','繋がりたい気分',
  '深夜のテンション','缶コーヒーうまい','空見てた','ひとこといいたかっただけ',
  '最近余裕ない','ゆっくりしたい','なんかドキドキしてる','いい夢みた',
];
const BOT_REPLIES = [
  'わかる〜','それ最高だよね','今同じこと思ってた','すごくわかる','ほんとそれ',
  'なんか共感しかない','えっそれ私も','ふかいね','そっかそっか','うんうん',
  'きいてくれる？','なんかいいね','それな','たしかに','ちょっと気持ちわかるかも',
  'おなじきもち','なんか懐かしい感じする','なんでだろうね','ふかいこというね',
  'ありがとういってくれて','そういう夜あるよね','なんかほっとした',
  'もうちょっと聞かせて','なんかいい','うまく言えないけどわかる',
];
const generateBotDrops = (countPerBot = 8) => {
  const colors = ['hsla(200,70%,90%,0.9)','hsla(280,60%,90%,0.9)','hsla(340,60%,92%,0.9)','hsla(150,50%,88%,0.9)','hsla(30,60%,90%,0.9)'];
  const commonWords = ['暇', 'おなかすいた', 'ごはん', '音楽', '映画', '寝', '寂', '眠', '疲れ', '仕事', '学校', 'だるい', '最高', 'いいこと', '悩み', '空'];
  const clusters = {};

  const botDrops = BOT_USERS.flatMap((bot, bi) =>
    Array.from({ length: countPerBot }, (_, i) => {
      const text = BOT_DROP_TEXTS[Math.floor(Math.random() * BOT_DROP_TEXTS.length)];
      const matchedIdx = commonWords.findIndex(w => text.includes(w));
      let x, y;
      
      if (matchedIdx !== -1) {
        if (!clusters[matchedIdx]) {
          clusters[matchedIdx] = { x: Math.random() * (CANVAS_SIZE - 1000) + 500, y: Math.random() * (CANVAS_SIZE - 1000) + 500 };
        }
        x = (clusters[matchedIdx].x + (Math.random() * 200 - 100) + CANVAS_SIZE) % CANVAS_SIZE;
        y = (clusters[matchedIdx].y + (Math.random() * 200 - 100) + CANVAS_SIZE) % CANVAS_SIZE;
      } else {
        x = Math.random() * CANVAS_SIZE;
        y = Math.random() * CANVAS_SIZE;
      }

      return {
        id: `bot-${bot.id}-${Date.now()}-${i}-${Math.random()}`,
        text, userId: bot.id, userName: bot.name, ageGroup: bot.ageGroup, avatar: bot.avatar,
        color: colors[(bi + i) % colors.length],
        x, y, animType: Math.floor(Math.random() * 3) + 1, animDelay: -Math.random() * 5,
        isMine: false, isOnline: Math.random() > 0.5, isBot: true,
        likes: Math.floor(Math.random() * 3), likedByMe: false, createdAt: Date.now() - Math.random() * 60000,
        mediaUrl: null,
      };
    })
  );

  const CANVAS_SIZE = 4000;
  botDrops.push({
    id: `ad-oshipay-${Date.now()}`,
    text: "OshiPay\nその感動、今すぐカタチに。",
    link: "https://oshipay.me/",
    userId: "ad-oshipay",
    userName: "Sponsored",
    ageGroup: "広告",
    avatar: "https://oshipay.me/favicon.ico",
    color: "hsla(45, 100%, 85%, 0.95)",
    x: Math.random() * CANVAS_SIZE,
    y: Math.random() * CANVAS_SIZE,
    animType: 1, animDelay: 0,
    isMine: false, isOnline: true, isBot: true,
    likes: 99, likedByMe: false, createdAt: Date.now(),
    mediaUrl: null,
  });

  return botDrops;
};
const compressImage = (file) => new Promise((resolve) => {
  const img = new Image();
  const objectUrl = URL.createObjectURL(file);
  img.onload = () => {
    const MAX = 1080;
    let { width, height } = img;
    if (width > MAX || height > MAX) { const r = Math.min(MAX/width, MAX/height); width = Math.round(width*r); height = Math.round(height*r); }
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    canvas.getContext('2d').drawImage(img, 0, 0, width, height);
    canvas.toBlob(blob => { URL.revokeObjectURL(objectUrl); resolve(blob); }, 'image/jpeg', 0.85);
  };
  img.src = objectUrl;
});

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
  isBot: false,
  mediaUrl: drop.media_url || null,
  mediaType: drop.media_type || null,
});

// --- LoginScreen ---
const LoginScreen = ({ onGoogleLogin, onLineLogin }) => {
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
        {/* LINE ログインボタン (最優先) */}
        <button
          onClick={() => agreed && onLineLogin()}
          className={`w-full py-4 bg-[#06C755] text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition shadow-md ${!agreed ? 'opacity-40 cursor-not-allowed' : 'hover:brightness-110'}`}
        >
          <MessageCircle size={20} /> LINEでログイン
        </button>

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
const SpaceScreen = ({
  drops, setDrops, camera, setCamera, now,
  myDropText, setMyDropText, myDropCooldown, handleMyDrop,
  selectedDrop, setSelectedDrop, handleCatch, handleSyncRequest, handleDeleteDrop, handleLike,
  handleBlock, handleReport, setIsSettingsOpen,
  dropMedia, setDropMedia, dropMediaInputRef,
  scale, setScale,
}) => {
  const [isWinding, setIsWinding] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggingDropId, setDraggingDropId] = useState(null);
  const [editingMedia, setEditingMedia] = useState(null);
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
      if (dist < 20 && drop) handleCatch(drop);
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
  const handleWind = () => {
    if (isWinding) return;
    setIsWinding(true);
    
    const groups = {};
    const processedDrops = drops.map(d => {
      let tx = Math.random() * CANVAS_SIZE;
      let ty = Math.random() * CANVAS_SIZE;
      
      const text = d.text.toLowerCase();
      // キーワードを増やしてグルーピングの精度を上げる
      const commonWords = [
        '暇', 'おなかすいた', 'ごはん', '音楽', '映画', '寝', '寂', '眠', 
        '疲れ', '仕事', '学校', 'だるい', '最高', 'いいこと', '悩み', '空'
      ];
      const matchedIdx = commonWords.findIndex(w => text.includes(w));
      
      if (matchedIdx !== -1) {
        if (!groups[matchedIdx]) {
          groups[matchedIdx] = { x: Math.random() * (CANVAS_SIZE-800) + 400, y: Math.random() * (CANVAS_SIZE-800) + 400 };
        }
        // グループ内では 150px 範囲に寄せ、密着感を出す
        tx = (groups[matchedIdx].x + (Math.random() * 150 - 75) + CANVAS_SIZE) % CANVAS_SIZE;
        ty = (groups[matchedIdx].y + (Math.random() * 150 - 75) + CANVAS_SIZE) % CANVAS_SIZE;
      } else {
        // グループ外は CANVAS_SIZE 全体に広く散らす
        tx = Math.random() * CANVAS_SIZE;
        ty = Math.random() * CANVAS_SIZE;
      }

      return { ...d, x: tx, y: ty, isPopping: true };
    });

    setDrops(processedDrops);
    setTimeout(() => {
      setDrops(prev => prev.map(d => ({ ...d, isPopping: false })));
      setIsWinding(false);
    }, 1500); // 演出時間を少し長めに
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

      <button onClick={() => setIsSettingsOpen(true)} className="fixed right-6 z-[100] p-3 bg-white/40 backdrop-blur-md border border-white/60 rounded-full text-slate-700 hover:bg-white/60 transition shadow-sm"
        style={{ top: 'calc(1.5rem + env(safe-area-inset-top))' }}>
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
                style={{ left: `${cx + dx}px`, top: `${cy + dy}px`, transition: drop.isPopping ? 'left 1.5s ease-out, top 1.5s ease-out' : 'none', opacity, animation: isBeingDragged ? 'none' : `float${drop.animType} ${4 + drop.animType}s ease-in-out infinite`, animationDelay: isBeingDragged ? '0s' : `${drop.animDelay}s`, zIndex: isBeingDragged ? 50 : 10 }}
              >
                <div
                  className={`flex items-center gap-3 p-2 pr-6 rounded-full bg-white/40 backdrop-blur-md transition-all duration-300 ease-out group-hover:bg-white/60 ${isBeingDragged ? 'ring-2 ring-white/50 scale-105' : ''}`}
                  style={{ transform: `scale(${dropScale})`, boxShadow: glowShadow, border: `2px solid ${borderColor}` }}
                >
                  <div className="relative">
                    <img src={drop.avatar} alt="avatar" className="w-12 h-12 rounded-full border-2 border-white object-cover shadow-sm pointer-events-none" draggable="false" />
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${drop.isOnline ? 'bg-green-500' : 'bg-slate-400'}`}></span>
                  </div>
                  <span className="text-base font-bold whitespace-nowrap text-slate-700 drop-shadow-sm pointer-events-none flex items-center gap-1.5">
                    {drop.text.length > 12 ? drop.text.slice(0, 12) + '...' : drop.text}
                    {drop.mediaUrl && (
                      <div className="p-1 bg-sky-100 rounded-lg text-sky-500">
                        <Camera size={14} />
                      </div>
                    )}
                  </span>
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
          <p className="text-xl font-bold mb-4 text-slate-800 text-center whitespace-pre-wrap">"{selectedDrop.text}"</p>
          {selectedDrop.link && (
            <a href={selectedDrop.link} target="_blank" rel="noopener noreferrer" className="w-full mb-4 py-3 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center font-bold hover:bg-sky-200 transition shadow-sm">
              公式サイトを開く
            </a>
          )}
          
          {selectedDrop.mediaUrl && (
             <div className="w-full max-h-60 rounded-2xl overflow-hidden mb-6 bg-slate-100 flex items-center justify-center">
               {selectedDrop.mediaType && selectedDrop.mediaType.startsWith('video') ? (
                 <video src={selectedDrop.mediaUrl} controls className="w-full h-full object-contain" />
               ) : (
                 <img src={selectedDrop.mediaUrl} alt="drop-media" className="w-full h-full object-contain" />
               )}
             </div>
          )}

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

      {/* 投稿前のメディアプレビュー */}
      {/* 投稿前のメディア専用モーダル (Post Modal) */}
      {dropMedia && (
        <div className="absolute inset-0 z-[200] bg-black/80 flex flex-col items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col">
            <div className="relative aspect-square bg-slate-100 flex items-center justify-center text-slate-400">
              <button 
                type="button" 
                onClick={() => setDropMedia(null)}
                className="absolute top-3 right-3 bg-black/40 text-white rounded-full p-2 hover:bg-black/60 z-10 transition shadow-md"
              >
                <X size={20} />
              </button>
              {dropMedia.type.startsWith('video') ? (
                <video src={dropMedia.preview} className="w-full h-full object-cover" controls playsInline />
              ) : (
                <img src={dropMedia.preview} className="w-full h-full object-cover" alt="preview" />
              )}
            </div>
            
            <form onSubmit={handleMyDrop} className="p-4 bg-white flex flex-col gap-3">
              <textarea
                value={myDropText}
                onChange={(e) => setMyDropText(e.target.value)}
                placeholder="メッセージを入力 (最大30文字)"
                className="w-full bg-slate-50 border-none rounded-xl p-3 text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-sky-400"
                maxLength={30}
                rows={2}
              />
              <button type="submit" disabled={myDropCooldown > 0} className="w-full py-3.5 bg-sky-500 text-white rounded-xl font-bold hover:bg-sky-600 transition flex justify-center items-center gap-2 disabled:opacity-50">
                <Send size={18} /> Dropする
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Drop Input */}
      {(!dropMedia && !editingMedia) && (
      <div
        className="absolute left-1/2 transform -translate-x-1/2 w-[90%] max-w-md z-40"
        style={{ bottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
        onPointerDown={stopPropagation} onPointerMove={stopPropagation} onPointerUp={stopPropagation}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleWind}
            className={`p-4 rounded-full bg-white/80 border-2 border-white backdrop-blur-md text-sky-500 shadow-lg transition-transform ${isWinding ? 'animate-spin' : 'hover:scale-110 active:scale-95'}`}
          >
            <Wind size={24} />
          </button>
          <form onSubmit={handleMyDrop} className="flex-1 relative">
            <input
              name="dropText" type="text"
              value={myDropText}
              onChange={(e) => setMyDropText(e.target.value)}
              placeholder={myDropCooldown > 0 ? `次のDropまで ${myDropCooldown}秒...` : "今の気持ちをDropする..."}
              disabled={myDropCooldown > 0}
              className="w-full bg-white/80 border-2 border-white backdrop-blur-md rounded-full py-4 pl-12 pr-14 text-slate-800 placeholder-slate-500 focus:outline-none focus:bg-white shadow-lg disabled:opacity-70 font-medium"
              maxLength={30}
            />
            <input
              ref={dropMediaInputRef} type="file" accept="image/*,video/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files[0];
                if (!file) return;
                if (file.type.startsWith('image/')) {
                  setEditingMedia(file);
                } else {
                  if (file.size > MAX_VIDEO_SIZE) {
                    alert('動画は50MB以内にしてください。'); return;
                  }
                  setDropMedia({ file, type: file.type, preview: URL.createObjectURL(file) });
                }
                e.target.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => dropMediaInputRef.current?.click()}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 p-2 text-sky-400 hover:text-sky-500 z-10"
            >
              <Camera size={20} />
            </button>
            <button type="submit" disabled={myDropCooldown > 0} className="absolute right-2 top-2 bottom-2 aspect-square bg-sky-500 text-white rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-sky-600 transition shadow-sm">
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
      )}

      {editingMedia && (
        <MediaCropModal 
          imageFile={editingMedia}
          onConfirm={(blob) => {
            setDropMedia({ file: blob, type: 'image/jpeg', preview: URL.createObjectURL(blob) });
            setEditingMedia(null);
          }}
          onCancel={() => setEditingMedia(null)}
        />
      )}
    </div>
  );
};

// --- RoomScreen ---

const RoomScreen = ({ roomTime, chatPartner, messages, chatInput, setChatInput, handleSendMessage, errorMessage, handleNext, handleExtend, extendRequested, handleReport, handleBlockAndExit }) => {
  const [showRoomMenu, setShowRoomMenu] = useState(false);
  const bottomRef = useRef(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  return (
    <div className="flex flex-col bg-sky-50 text-slate-800 relative overflow-hidden" style={{ height: '100dvh' }}>
      <div
        className="fixed top-0 left-0 right-0 flex items-center justify-between bg-white/95 backdrop-blur-md border-b border-sky-100 shadow-sm z-50 shrink-0"
        style={{ padding: '0.75rem 1rem', paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center gap-3">
          <img src={chatPartner?.avatar || 'https://i.pravatar.cc/150?u=me'} alt="avatar" className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover" />
          <span className="font-bold text-slate-700">{chatPartner?.userName || '匿名'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 font-mono text-xl font-bold ${roomTime <= 10 ? 'text-rose-500 animate-pulse' : 'text-sky-500'}`}>
            <Clock size={20} />{formatTime(roomTime)}
          </div>

          <button onClick={handleNext} className="text-sm px-3 py-2 bg-rose-100 text-rose-600 hover:bg-rose-200 rounded-full transition font-bold flex items-center gap-1">
            <DoorOpen size={15} />退席
          </button>
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

      {/* メッセージリスト */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 scroll-smooth" style={{ marginTop: 'calc(3.5rem + env(safe-area-inset-top))' }}>
        {messages.map(msg => (
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

// --- アバタークロップモーダル ---
const CROP_SIZE = 260;

const AvatarCropModal = ({ imageFile, onConfirm, onCancel }) => {
  const imgRef = useRef(null);       // hidden <img> for pixel data
  const canvasRef = useRef(null);    // visible preview canvas
  const rafRef = useRef(null);
  const offsetRef = useRef({ x: 0, y: 0 }); // image center offset from circle center (screen coords)
  const scaleRef = useRef(1);
  const rotationRef = useRef(0); // degrees: 0, 90, 180, 270
  const [imgSrc, setImgSrc] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const lastTouchRef = useRef(null);
  const lastPinchRef = useRef(null);
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef(null);

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = e => setImgSrc(e.target.result);
    reader.readAsDataURL(imageFile);
  }, [imageFile]);

  const getBaseScale = () => {
    const img = imgRef.current;
    if (!img?.naturalWidth) return 1;
    return Math.max(CROP_SIZE / img.naturalWidth, CROP_SIZE / img.naturalHeight);
  };

  const getDims = () => {
    const img = imgRef.current;
    if (!img?.naturalWidth) return { dw: CROP_SIZE, dh: CROP_SIZE };
    const bs = getBaseScale();
    return { dw: img.naturalWidth * bs * scaleRef.current, dh: img.naturalHeight * bs * scaleRef.current };
  };

  // clamp so image always fully covers the circle
  const clamp = () => {
    const img = imgRef.current;
    if (!img?.naturalWidth) return;
    const { dw, dh } = getDims();
    const isRot = (rotationRef.current / 90) % 2 !== 0;
    const mx = Math.max(0, ((isRot ? dh : dw) - CROP_SIZE) / 2);
    const my = Math.max(0, ((isRot ? dw : dh) - CROP_SIZE) / 2);
    offsetRef.current.x = Math.max(-mx, Math.min(mx, offsetRef.current.x));
    offsetRef.current.y = Math.max(-my, Math.min(my, offsetRef.current.y));
  };

  // Draw current state to the preview canvas
  const draw = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img?.naturalWidth) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CROP_SIZE, CROP_SIZE);
    const { dw, dh } = getDims();
    ctx.save();
    ctx.beginPath();
    ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.translate(CROP_SIZE / 2 + offsetRef.current.x, CROP_SIZE / 2 + offsetRef.current.y);
    ctx.rotate(rotationRef.current * Math.PI / 180);
    ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
  };

  const scheduleDraw = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
  };

  useEffect(() => { if (loaded) scheduleDraw(); }, [loaded]);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const onTouchStart = (e) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        lastPinchRef.current = null;
      } else if (e.touches.length === 2) {
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        const dy = e.touches[1].clientY - e.touches[0].clientY;
        lastPinchRef.current = {
          dist: Math.hypot(dx, dy),
          midX: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          midY: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        };
        lastTouchRef.current = null;
      }
    };

    const onTouchMove = (e) => {
      e.preventDefault();
      if (e.touches.length === 1 && lastTouchRef.current) {
        // pan
        offsetRef.current.x += e.touches[0].clientX - lastTouchRef.current.x;
        offsetRef.current.y += e.touches[0].clientY - lastTouchRef.current.y;
        clamp();
        lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        scheduleDraw();
      } else if (e.touches.length === 2 && lastPinchRef.current) {
        const t0 = e.touches[0], t1 = e.touches[1];
        const newDist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
        const newMidClientX = (t0.clientX + t1.clientX) / 2;
        const newMidClientY = (t0.clientY + t1.clientY) / 2;
        const rect = el.getBoundingClientRect();

        // step 1: pan image with midpoint translation
        offsetRef.current.x += newMidClientX - lastPinchRef.current.midX;
        offsetRef.current.y += newMidClientY - lastPinchRef.current.midY;

        // step 2: zoom toward current midpoint in container coords
        const midX = newMidClientX - rect.left;
        const midY = newMidClientY - rect.top;
        const newScale = Math.max(1, Math.min(5, scaleRef.current * (newDist / lastPinchRef.current.dist)));
        const sr = newScale / scaleRef.current;
        offsetRef.current.x = (midX - CROP_SIZE / 2) * (1 - sr) + offsetRef.current.x * sr;
        offsetRef.current.y = (midY - CROP_SIZE / 2) * (1 - sr) + offsetRef.current.y * sr;
        scaleRef.current = newScale;

        clamp();
        lastPinchRef.current = { dist: newDist, midX: newMidClientX, midY: newMidClientY };
        scheduleDraw();
      }
    };

    const onTouchEnd = (e) => {
      if (e.touches.length < 2) lastPinchRef.current = null;
      if (e.touches.length < 1) lastTouchRef.current = null;
    };

    const onWheel = (e) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const midX = e.clientX - rect.left;
      const midY = e.clientY - rect.top;
      const newScale = Math.max(1, Math.min(5, scaleRef.current * (e.deltaY > 0 ? 0.9 : 1.1)));
      const sr = newScale / scaleRef.current;
      offsetRef.current.x = (midX - CROP_SIZE / 2) * (1 - sr) + offsetRef.current.x * sr;
      offsetRef.current.y = (midY - CROP_SIZE / 2) * (1 - sr) + offsetRef.current.y * sr;
      scaleRef.current = newScale;
      clamp();
      scheduleDraw();
    };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: false });
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('wheel', onWheel);
    };
  }, []);

  const handleMouseDown = (e) => { isDraggingRef.current = true; lastMouseRef.current = { x: e.clientX, y: e.clientY }; };
  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    offsetRef.current.x += e.clientX - lastMouseRef.current.x;
    offsetRef.current.y += e.clientY - lastMouseRef.current.y;
    clamp();
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
    scheduleDraw();
  };
  const handleMouseUp = () => { isDraggingRef.current = false; };

  const handleRotate = (dir) => {
    rotationRef.current = ((rotationRef.current + dir * 90) + 360) % 360;
    scaleRef.current = 1;
    offsetRef.current = { x: 0, y: 0 };
    scheduleDraw();
  };

  // Output canvas uses the exact same drawing code as preview — WYSIWYG
  const handleConfirm = () => {
    const img = imgRef.current;
    if (!img || !loaded) return;
    const { dw, dh } = getDims();
    const OUTPUT = 200;
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT; canvas.height = OUTPUT;
    const ctx = canvas.getContext('2d');
    const r = OUTPUT / CROP_SIZE;
    ctx.beginPath();
    ctx.arc(OUTPUT / 2, OUTPUT / 2, OUTPUT / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.translate((CROP_SIZE / 2 + offsetRef.current.x) * r, (CROP_SIZE / 2 + offsetRef.current.y) * r);
    ctx.rotate(rotationRef.current * Math.PI / 180);
    ctx.drawImage(img, -dw / 2 * r, -dh / 2 * r, dw * r, dh * r);
    canvas.toBlob(blob => onConfirm(blob), 'image/jpeg', 0.85);
  };

  return (
    <div className="absolute inset-0 z-[300] bg-black/80 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
        <h3 className="text-center font-bold text-slate-800 mb-4 text-lg">写真を調整</h3>

        {/* Hidden img for pixel data */}
        {imgSrc && <img ref={imgRef} src={imgSrc} onLoad={() => setLoaded(true)} style={{ display: 'none' }} alt="" />}

        {/* Canvas preview */}
        <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
          <canvas
            ref={canvasRef}
            width={CROP_SIZE}
            height={CROP_SIZE}
            style={{ width: CROP_SIZE, height: CROP_SIZE, borderRadius: '50%', border: '4px solid #38bdf8', display: 'block', cursor: 'grab', touchAction: 'none', flexShrink: 0 }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
          {!loaded && (
            <div style={{ position: 'absolute', width: CROP_SIZE, height: CROP_SIZE, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 14, background: 'rgba(255,255,255,0.8)' }}>
              読み込み中…
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-2">ドラッグで移動・ピンチで拡大縮小</p>
        <div className="flex justify-center gap-4 mt-3 mb-4">
          <button type="button" onClick={() => handleRotate(-1)} className="px-5 py-2 bg-slate-100 rounded-xl text-slate-600 hover:bg-slate-200 transition text-sm font-medium">↺ 左90°</button>
          <button type="button" onClick={() => handleRotate(1)} className="px-5 py-2 bg-slate-100 rounded-xl text-slate-600 hover:bg-slate-200 transition text-sm font-medium">右90° ↻</button>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition">キャンセル</button>
          <button onClick={handleConfirm} disabled={!loaded} className="flex-1 py-3 bg-sky-500 text-white rounded-2xl font-bold hover:bg-sky-600 transition disabled:opacity-50">決定</button>
        </div>
      </div>
    </div>
  );
};


// --- メディアクロップモーダル ---
const MEDIA_CROP_SIZE = 300;

const MediaCropModal = ({ imageFile, onConfirm, onCancel }) => {
  const imgRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const rafRef = React.useRef(null);
  const offsetRef = React.useRef({ x: 0, y: 0 });
  const scaleRef = React.useRef(1);
  const rotationRef = React.useRef(0);
  const [imgSrc, setImgSrc] = React.useState(null);
  const [loaded, setLoaded] = React.useState(false);
  const lastTouchRef = React.useRef(null);
  const lastPinchRef = React.useRef(null);
  const isDraggingRef = React.useRef(false);
  const lastMouseRef = React.useRef(null);

  React.useEffect(() => {
    const reader = new FileReader();
    reader.onload = e => setImgSrc(e.target.result);
    reader.readAsDataURL(imageFile);
  }, [imageFile]);

  const getBaseScale = () => {
    const img = imgRef.current;
    if (!img?.naturalWidth) return 1;
    return Math.max(MEDIA_CROP_SIZE / img.naturalWidth, MEDIA_CROP_SIZE / img.naturalHeight);
  };

  const getDims = () => {
    const img = imgRef.current;
    if (!img?.naturalWidth) return { dw: MEDIA_CROP_SIZE, dh: MEDIA_CROP_SIZE };
    const bs = getBaseScale();
    return { dw: img.naturalWidth * bs * scaleRef.current, dh: img.naturalHeight * bs * scaleRef.current };
  };

  const clamp = () => {
    const img = imgRef.current;
    if (!img?.naturalWidth) return;
    const { dw, dh } = getDims();
    const isRot = (rotationRef.current / 90) % 2 !== 0;
    const mx = Math.max(0, ((isRot ? dh : dw) - MEDIA_CROP_SIZE) / 2);
    const my = Math.max(0, ((isRot ? dw : dh) - MEDIA_CROP_SIZE) / 2);
    offsetRef.current.x = Math.max(-mx, Math.min(mx, offsetRef.current.x));
    offsetRef.current.y = Math.max(-my, Math.min(my, offsetRef.current.y));
  };

  const draw = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img?.naturalWidth) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, MEDIA_CROP_SIZE, MEDIA_CROP_SIZE);
    const { dw, dh } = getDims();
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, MEDIA_CROP_SIZE, MEDIA_CROP_SIZE);
    ctx.clip();
    ctx.translate(MEDIA_CROP_SIZE / 2 + offsetRef.current.x, MEDIA_CROP_SIZE / 2 + offsetRef.current.y);
    ctx.rotate(rotationRef.current * Math.PI / 180);
    ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
  };

  const scheduleDraw = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
  };

  React.useEffect(() => { if (loaded) scheduleDraw(); }, [loaded]);

  React.useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const onTouchStart = (e) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        lastPinchRef.current = null;
      } else if (e.touches.length === 2) {
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        const dy = e.touches[1].clientY - e.touches[0].clientY;
        lastPinchRef.current = {
          dist: Math.hypot(dx, dy),
          midX: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          midY: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        };
        lastTouchRef.current = null;
      }
    };

    const onTouchMove = (e) => {
      e.preventDefault();
      if (e.touches.length === 1 && lastTouchRef.current) {
        offsetRef.current.x += e.touches[0].clientX - lastTouchRef.current.x;
        offsetRef.current.y += e.touches[0].clientY - lastTouchRef.current.y;
        clamp();
        lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        scheduleDraw();
      } else if (e.touches.length === 2 && lastPinchRef.current) {
        const t0 = e.touches[0], t1 = e.touches[1];
        const newDist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
        const newMidClientX = (t0.clientX + t1.clientX) / 2;
        const newMidClientY = (t0.clientY + t1.clientY) / 2;
        const rect = el.getBoundingClientRect();

        offsetRef.current.x += newMidClientX - lastPinchRef.current.midX;
        offsetRef.current.y += newMidClientY - lastPinchRef.current.midY;

        const midX = newMidClientX - rect.left;
        const midY = newMidClientY - rect.top;
        const newScale = Math.max(1, Math.min(5, scaleRef.current * (newDist / lastPinchRef.current.dist)));
        const sr = newScale / scaleRef.current;
        offsetRef.current.x = (midX - MEDIA_CROP_SIZE / 2) * (1 - sr) + offsetRef.current.x * sr;
        offsetRef.current.y = (midY - MEDIA_CROP_SIZE / 2) * (1 - sr) + offsetRef.current.y * sr;
        scaleRef.current = newScale;

        clamp();
        lastPinchRef.current = { dist: newDist, midX: newMidClientX, midY: newMidClientY };
        scheduleDraw();
      }
    };

    const onTouchEnd = (e) => {
      if (e.touches.length < 2) lastPinchRef.current = null;
      if (e.touches.length < 1) lastTouchRef.current = null;
    };

    const onWheel = (e) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const midX = e.clientX - rect.left;
      const midY = e.clientY - rect.top;
      const newScale = Math.max(1, Math.min(5, scaleRef.current * (e.deltaY > 0 ? 0.9 : 1.1)));
      const sr = newScale / scaleRef.current;
      offsetRef.current.x = (midX - MEDIA_CROP_SIZE / 2) * (1 - sr) + offsetRef.current.x * sr;
      offsetRef.current.y = (midY - MEDIA_CROP_SIZE / 2) * (1 - sr) + offsetRef.current.y * sr;
      scaleRef.current = newScale;
      clamp();
      scheduleDraw();
    };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: false });
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('wheel', onWheel);
    };
  }, []);

  const handleMouseDown = (e) => { isDraggingRef.current = true; lastMouseRef.current = { x: e.clientX, y: e.clientY }; };
  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    offsetRef.current.x += e.clientX - lastMouseRef.current.x;
    offsetRef.current.y += e.clientY - lastMouseRef.current.y;
    clamp();
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
    scheduleDraw();
  };
  const handleMouseUp = () => { isDraggingRef.current = false; };

  const handleRotate = (dir) => {
    rotationRef.current = ((rotationRef.current + dir * 90) + 360) % 360;
    scaleRef.current = 1;
    offsetRef.current = { x: 0, y: 0 };
    scheduleDraw();
  };

  const handleConfirm = () => {
    const img = imgRef.current;
    if (!img || !loaded) return;
    const { dw, dh } = getDims();
    const OUTPUT = 600; // Better quality for dropped images
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT; canvas.height = OUTPUT;
    const ctx = canvas.getContext('2d');
    const r = OUTPUT / MEDIA_CROP_SIZE;
    ctx.beginPath();
    ctx.rect(0, 0, OUTPUT, OUTPUT);
    ctx.clip();
    ctx.translate((MEDIA_CROP_SIZE / 2 + offsetRef.current.x) * r, (MEDIA_CROP_SIZE / 2 + offsetRef.current.y) * r);
    ctx.rotate(rotationRef.current * Math.PI / 180);
    ctx.drawImage(img, -dw / 2 * r, -dh / 2 * r, dw * r, dh * r);
    canvas.toBlob(blob => onConfirm(blob), 'image/jpeg', 0.85);
  };

  return (
    <div className="absolute inset-0 z-[300] bg-black/80 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
        <h3 className="text-center font-bold text-slate-800 mb-4 text-lg">画像を編集</h3>

        {imgSrc && <img ref={imgRef} src={imgSrc} onLoad={() => setLoaded(true)} style={{ display: 'none' }} alt="" />}

        <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
          <canvas
            ref={canvasRef}
            width={MEDIA_CROP_SIZE}
            height={MEDIA_CROP_SIZE}
            style={{ width: MEDIA_CROP_SIZE, height: MEDIA_CROP_SIZE, borderRadius: '16px', border: '4px solid #38bdf8', display: 'block', cursor: 'grab', touchAction: 'none', flexShrink: 0 }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
          {!loaded && (
            <div style={{ position: 'absolute', width: MEDIA_CROP_SIZE, height: MEDIA_CROP_SIZE, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 14, background: 'rgba(255,255,255,0.8)' }}>
              読み込み中…
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-2 border-t pt-2 border-slate-100">ドラッグで移動・ピンチで拡大縮小</p>
        <div className="flex justify-center gap-4 mt-3 mb-4">
          <button type="button" onClick={() => handleRotate(-1)} className="px-5 py-2 bg-slate-100 rounded-xl text-slate-600 hover:bg-slate-200 transition text-sm font-medium">↺ 左90°</button>
          <button type="button" onClick={() => handleRotate(1)} className="px-5 py-2 bg-slate-100 rounded-xl text-slate-600 hover:bg-slate-200 transition text-sm font-medium">右90° ↻</button>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition">キャンセル</button>
          <button onClick={handleConfirm} disabled={!loaded} className="flex-1 py-3 bg-sky-500 text-white rounded-2xl font-bold hover:bg-sky-600 transition disabled:opacity-50">決定</button>
        </div>
      </div>
    </div>
  );
};

// --- メインアプリ ---
const App = () => {
  const [screen, setScreen] = useState('loading');
  const [authUser, setAuthUser] = useState(null);
  const [userProfile, setUserProfile] = useState({ name: '', birthDate: '', gender: '', avatarUrl: '' });

  const [drops, setDrops] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [camera, setCamera] = useState({ x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2 });
  const [scale, setScale] = useState(1);
  const [now, setNow] = useState(Date.now());
  const [myDropText, setMyDropText] = useState('');
  const [myDropCooldown, setMyDropCooldown] = useState(0);
  const [dropMedia, setDropMedia] = useState(null); // { file, preview, type }
  const dropMediaInputRef = useRef(null);
  const [selectedDrop, setSelectedDrop] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', birthDate: '', gender: '' });
  const [cropImage, setCropImage] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const avatarBlobRef = useRef(null);
  const fileInputRef = useRef(null);

  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [chatPartner, setChatPartner] = useState(null);
  const [roomTime, setRoomTime] = useState(INITIAL_ROOM_TIME);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [extendRequested, setExtendRequested] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [incomingRequest, setIncomingRequest] = useState(null);
  const [isBotRoom, setIsBotRoom] = useState(false);
  const [botUser, setBotUser] = useState(null);

  const authUserRef = useRef(null);
  authUserRef.current = authUser;

  // ─── Auth 初期化 & コールバック処理 ───
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    // LINE認証コードがURLに含まれている場合
    if (code && state === 'line_direct') {
      handleLineAuthCallback(code);
      return;
    }

    // 通常のセッション確認
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

  const handleLineAuthCallback = async (code) => {
    console.log('--- LINE Auth Callback Start ---');
    setScreen('loading');
    try {
      // 自作の Edge Function を呼び出してログイン
      console.log('Invoking line-auth function...');
      const { data, error } = await supabase.functions.invoke('line-auth', {
        body: { code, redirect_uri: REDIRECT_URL },
      });

      if (error) {
        console.error('Edge Function Error:', error);
        throw error;
      }

      console.log('Edge Function Success! Verifying token hash...');

      // 返ってきた token_hash を使って Supabase にログイン
      const { data: authData, error: loginError } = await supabase.auth.verifyOtp({
        token_hash: data.token_hash,
        type: 'magiclink',
      });

      if (loginError) {
        console.error('Verify OTP Error:', loginError);
        throw loginError;
      }

      console.log('Login Successful! User ID:', authData.user?.id);

      // 100%確実な荒技: セッション確立後にページを強制リロードする
      console.log('Hard reloading now...');
      window.location.href = REDIRECT_URL;
      
    } catch (err) {
      console.error('LINE Auth Error:', err);
      setScreen('login');
      alert('LINEログインに失敗しました。');
    }
  };

  const checkProfile = async (user) => {
    const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
    if (data) {
      setUserProfile({ name: data.name, birthDate: data.birth_date, gender: data.gender, avatarUrl: data.avatar_url || '' });
      setScreen('space');
    } else {
      // Googleアカウントの名前を初期値に
      setUserProfile(prev => ({ ...prev, name: user.user_metadata?.full_name || '' }));
      setScreen('profile');
    }
  };

  const handleLineLogin = () => {
    const LINE_CLIENT_ID = '2009662408'; 
    const state = 'line_direct';
    const scopes = encodeURIComponent('profile openid');
    const redirect = encodeURIComponent(REDIRECT_URL);
    
    // Supabase Auth を介さず、直接 LINE の認証画面へ飛ばす
    const lineAuthUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${LINE_CLIENT_ID}&redirect_uri=${redirect}&state=${state}&scope=${scopes}`;
    window.location.href = lineAuthUrl;
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: REDIRECT_URL,
        queryParams: { prompt: 'select_account' },
      },
    });
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

  // ─── Drops: 初期ロード + Realtime + Bot Drops ───
  useEffect(() => {
    if (screen !== 'space' || !authUser) return;
    let channel;

    const loadDrops = async () => {
      // [POC_ONLY] cutoffなしで全取得しBotを混入
      const { data } = await supabase
        .from('drops')
        .select('*, users(name, avatar_url, is_online, birth_date)');
      const realDrops = data ? data.map(d => toLocalDrop(d, authUser.id)) : [];
      setDrops([...realDrops, ...generateBotDrops()]);
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

    const timer = setInterval(() => { 
      setNow(Date.now()); 
      setDrops(prev => prev.length > MAX_DROPS 
        ? [...prev].sort((a, b) => b.createdAt - a.createdAt).slice(0, MAX_DROPS) 
        : prev);
    }, 5000);

    const physicsTimer = setInterval(() => {
      setDrops(prev => {
        let moved = false;
        const newDrops = prev.map(d => ({ ...d }));
        for (let i = 0; i < newDrops.length; i++) {
          for (let j = i + 1; j < newDrops.length; j++) {
            const di = newDrops[i];
            const dj = newDrops[j];
            
            let dx = dj.x - di.x;
            if (dx > CANVAS_SIZE / 2) dx -= CANVAS_SIZE;
            if (dx < -CANVAS_SIZE / 2) dx += CANVAS_SIZE;
            
            let dy = dj.y - di.y;
            if (dy > CANVAS_SIZE / 2) dy -= CANVAS_SIZE;
            if (dy < -CANVAS_SIZE / 2) dy += CANVAS_SIZE;

            const dist2 = dx*dx + dy*dy;
            const RADIUS = 280; // テキスト同士の重なりを防ぐため広めの半径を指定
            
            if (dist2 > 0 && dist2 < RADIUS * RADIUS) {
              const dist = Math.sqrt(dist2);
              const overlap = RADIUS - dist;
              const pushX = (dx / dist) * (overlap * 0.5);
              const pushY = (dy / dist) * (overlap * 0.5);
              
              di.x = (di.x - pushX + CANVAS_SIZE) % CANVAS_SIZE;
              di.y = (di.y - pushY + CANVAS_SIZE) % CANVAS_SIZE;
              dj.x = (dj.x + pushX + CANVAS_SIZE) % CANVAS_SIZE;
              dj.y = (dj.y + pushY + CANVAS_SIZE) % CANVAS_SIZE;
              
              di.isPopping = true; 
              dj.isPopping = true;
              moved = true;
            }
          }
        }
        return moved ? newDrops : prev;
      });
      setTimeout(() => setDrops(prev => prev.map(d => d.isPopping ? { ...d, isPopping: false } : d)), 600);
    }, 1500);
    
    // 30分おきにボットドロップを再生成（古いものを置換）
    const botTimer = setInterval(() => {
      setDrops(prev => {
        const realDrops = prev.filter(d => !d.id.toString().startsWith('bot-'));
        return [...realDrops, ...generateBotDrops()];
      });
    }, 30 * 60 * 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(timer);
      clearInterval(physicsTimer);
      clearInterval(botTimer);
    };
  }, [screen, authUser]);

  // ─── WaitingScreen: ルームのステータス変化を監視（実ユーザーのみ）───
  useEffect(() => {
    if (screen !== 'waiting' || !currentRoomId || isBotRoom) return;
    const channel = supabase.channel(`room-status:${currentRoomId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${currentRoomId}` },
        (payload) => {
          if (payload.new.status === 'active') { setScreen('room'); setRoomTime(INITIAL_ROOM_TIME); setMessages([]); }
          else if (payload.new.status === 'declined') { setCurrentRoomId(null); setChatPartner(null); setScreen('space'); }
        }
      ).subscribe();
    const timeout = setTimeout(async () => {
      if (!currentRoomId) return;
      await supabase.from('rooms').update({ status: 'declined' }).eq('id', currentRoomId);
      setCurrentRoomId(null); setChatPartner(null); setScreen('space');
    }, 30000);
    return () => { supabase.removeChannel(channel); clearTimeout(timeout); };
  }, [screen, currentRoomId, isBotRoom]);

  // ─── 初回入室 5秒後の Bot 着信 ───
  useEffect(() => {
    if (screen !== 'space' || !authUser) return;
    const timer = setTimeout(() => {
      // すでに着信がある場合はスキップ
      setIncomingRequest(prev => {
        if (prev) return prev;
        const bot = BOT_USERS[Math.floor(Math.random() * BOT_USERS.length)];
        return {
          partner: { userName: bot.name, ageGroup: bot.ageGroup, avatar: bot.avatar, userId: bot.id },
          dropText: 'はじめまして！空を眺めるのっていいですよね。',
          roomId: null,
          isBot: true,
        };
      });
    }, 5000);
    return () => clearTimeout(timer);
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
            isBot: false,
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
    return { x: Math.random() * CANVAS_SIZE, y: Math.random() * CANVAS_SIZE };
  };

  const handleMyDrop = async (e) => {
    e.preventDefault();
    if (!myDropText.trim() || myDropCooldown > 0 || !authUser) return;

    let mediaUrl = null;
    let mediaType = null;

    if (dropMedia) {
      const fileName = `${authUser.id}_${Date.now()}`;
      let fileToUpload = dropMedia.file;

      // 画像の場合はあらかじめ圧縮
      if (dropMedia.type.startsWith('image/')) {
        fileToUpload = await compressImage(dropMedia.file);
      }

      // Supabase Storage にアップロード
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('drops-media')
        .upload(fileName, fileToUpload, { 
          contentType: dropMedia.type,
          upsert: true 
        });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        alert(`メディアのアップロードに失敗しました (${uploadError.name}): ${uploadError.message}`);
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from('drops-media').getPublicUrl(fileName);
      mediaUrl = publicUrl;
      mediaType = dropMedia.type;
    }

    const pos = getPositionForDrop(myDropText, drops, true);
    const color = `hsla(${Math.random() * 360}, 60%, 90%, 0.9)`;
    const { data, error } = await supabase.from('drops').insert({
      user_id: authUser.id, text: myDropText, color,
      pos_x: pos.x, pos_y: pos.y, anim_type: Math.floor(Math.random() * 3) + 1,
      media_url: mediaUrl, media_type: mediaType,
    }).select('*, users(name, avatar_url, is_online, birth_date)').single();

    if (!error && data) {
      const localDrop = toLocalDrop(data, authUser.id, userProfile);
      setDrops(prev => prev.find(d => d.id === localDrop.id) ? prev : [...prev, localDrop]);
      setMyDropCooldown(60);
      const droppedText = myDropText;
      setMyDropText('');
      setDropMedia(null);
      setCamera({ x: data.pos_x, y: data.pos_y });
      // Drop待5秒後にBotから着信リクエスト
      setTimeout(() => {
        const bot = BOT_USERS[Math.floor(Math.random() * BOT_USERS.length)];
        setIncomingRequest({
          partner: { userName: bot.name, ageGroup: bot.ageGroup, avatar: bot.avatar, userId: bot.id },
          dropText: droppedText, roomId: null, isBot: true,
        });
      }, 5000);
    } else if (error) {
      alert('投稿に失敗しました: ' + error.message);
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
    if (!selectedDrop.isOnline && !selectedDrop.isBot) {
      alert('相手がオフラインのため、今は会話を開始できません。');
      return;
    }

    if (selectedDrop.isBot) {
      const bot = BOT_USERS.find(b => b.id === selectedDrop.userId);
      setBotUser(bot || null);
      setIsBotRoom(true);
      setChatPartner(selectedDrop);
      setScreen('waiting');
      setSelectedDrop(null);
      setTimeout(() => {
        setScreen('room');
        setRoomTime(INITIAL_ROOM_TIME);
        setMessages([{ id: 'bot-sys-1', text: '波長が合いました。5分間のSyncを開始します。', isMine: false, isSystem: true }]);
      }, 2000);
      return;
    }

    const expiresAt = new Date(Date.now() + INITIAL_ROOM_TIME * 1000).toISOString();
    const { data: room, error } = await supabase.from('rooms').insert({
      user1_id: selectedDrop.userId,
      user2_id: authUser.id,
      expires_at: expiresAt,
      status: 'pending',
    }).select().single();
    if (error) { alert('接続に失敗しました: ' + error.message); return; }
    // システムメッセージを挿入
    await supabase.from('messages').insert({ room_id: room.id, user_id: authUser.id, text: '波長が合いました。5分間のSyncを開始します。', is_system: true });
    setCurrentRoomId(room.id);
    setChatPartner(selectedDrop);
    setIsBotRoom(false);
    setScreen('waiting');
    setSelectedDrop(null);
    // 注: 実ユーザーの場合は WaitingScreen の useEffect が status: active を検知して自動遷移します
  };

  const handleAcceptRequest = async () => {
    if (!incomingRequest) return;
    if (incomingRequest.isBot) {
      const bot = BOT_USERS.find(b => b.id === incomingRequest.partner.userId);
      setBotUser(bot || null); setIsBotRoom(true);
      setChatPartner(incomingRequest.partner); setIncomingRequest(null);
      setScreen('room'); setRoomTime(INITIAL_ROOM_TIME);
      setMessages([{ id: 'bot-sys-1', text: '波長が合いました。5分間のSyncを開始します。', isMine: false, isSystem: true }]);
      return;
    }
    await supabase.from('rooms').update({ status: 'active' }).eq('id', incomingRequest.roomId);
    setCurrentRoomId(incomingRequest.roomId); setChatPartner(incomingRequest.partner);
    setIncomingRequest(null); setScreen('room'); setRoomTime(INITIAL_ROOM_TIME); setMessages([]);
  };

  const handleDeclineRequest = async () => {
    if (incomingRequest && incomingRequest.roomId) {
      await supabase.from('rooms').update({ status: 'declined' }).eq('id', incomingRequest.roomId);
    }
    setIncomingRequest(null);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !authUser) return;
    if (NG_WORDS.some(w => chatInput.toLowerCase().includes(w))) {
      setErrorMessage('送信できない言葉が含まれています。');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    if (isBotRoom) {
      const myMsg = { id: `local-${Date.now()}`, text: chatInput, isMine: true, isSystem: false };
      setMessages(prev => [...prev, myMsg]); setChatInput('');
      setTimeout(() => {
        const reply = BOT_REPLIES[Math.floor(Math.random() * BOT_REPLIES.length)];
        setMessages(prev => [...prev, { id: `bot-${Date.now()}`, text: reply, isMine: false, isSystem: false }]);
      }, 1000 + Math.random() * 2000);
      return;
    }
    if (!currentRoomId) return;
    await supabase.from('messages').insert({ room_id: currentRoomId, user_id: authUser.id, text: chatInput, is_system: false });
    setChatInput('');
  };

  const handleFadeOut = () => {
    setScreen('fade');
    setCurrentRoomId(null); setChatPartner(null);
    setIsBotRoom(false); setBotUser(null);
    setTimeout(() => { setScreen('space'); setRoomTime(INITIAL_ROOM_TIME); setMessages([]); setExtendRequested(false); }, 1500);
  };

  const handleExtend = () => {
    setExtendRequested(true);
    // 本実装では相手も押したら延長。POCでは1.5秒後に自動延長
    setTimeout(() => { setRoomTime(prev => prev + EXTEND_TIME); setExtendRequested(false); setMessages(prev => [...prev, { id: Date.now(), text: 'システム: 5分間Extendされました✨', isSystem: true }]); }, 1500);
  };

  const openEditProfile = () => {
    setEditForm({ name: userProfile.name, birthDate: userProfile.birthDate, gender: userProfile.gender });
    setAvatarPreview(null);
    avatarBlobRef.current = null;
    setIsEditingProfile(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropImage(file);
    e.target.value = '';
  };

  const handleCropConfirm = (blob) => {
    avatarBlobRef.current = blob;
    setAvatarPreview(URL.createObjectURL(blob));
    setCropImage(null);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!authUser) return;
    let newAvatarUrl = userProfile.avatarUrl;
    if (avatarBlobRef.current) {
      const filePath = `${authUser.id}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarBlobRef.current, { upsert: true, contentType: 'image/jpeg' });
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
        newAvatarUrl = publicUrl + '?t=' + Date.now();
      } else {
        alert('写真のアップロードに失敗しました: ' + uploadError.message);
        return;
      }
    }
    const updateData = { name: editForm.name, birth_date: editForm.birthDate, gender: editForm.gender };
    if (newAvatarUrl !== userProfile.avatarUrl) updateData.avatar_url = newAvatarUrl;
    const { error } = await supabase.from('users').update(updateData).eq('id', authUser.id);
    if (!error) {
      setUserProfile({ name: editForm.name, birthDate: editForm.birthDate, gender: editForm.gender, avatarUrl: newAvatarUrl });
      avatarBlobRef.current = null;
      setAvatarPreview(null);
      setIsEditingProfile(false);
    } else {
      alert('保存に失敗しました: ' + error.message);
    }
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
      {screen === 'login'   && <LoginScreen onGoogleLogin={handleGoogleLogin} onLineLogin={handleLineLogin} />}
      {screen === 'profile' && <ProfileScreen userProfile={userProfile} setUserProfile={setUserProfile} onSubmit={handleProfileSubmit} />}
      {screen === 'space'   && (
        <SpaceScreen
          drops={visibleDrops} setDrops={setDrops} camera={camera} setCamera={setCamera} now={now}
          myDropText={myDropText} setMyDropText={setMyDropText} myDropCooldown={myDropCooldown} handleMyDrop={handleMyDrop}
          selectedDrop={selectedDrop} setSelectedDrop={setSelectedDrop} handleCatch={handleCatch}
          handleSyncRequest={handleSyncRequest} handleDeleteDrop={handleDeleteDrop} handleLike={handleLike}
          handleBlock={handleBlock} handleReport={handleReport} setIsSettingsOpen={setIsSettingsOpen}
          scale={scale} setScale={setScale}
          dropMedia={dropMedia} setDropMedia={setDropMedia} dropMediaInputRef={dropMediaInputRef}
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
          <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto">

            {!isEditingProfile ? (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-800">設定</h3>
                  <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-2 transition"><X size={20} /></button>
                </div>

                {/* プロフィール表示 */}
                <div className="flex items-center gap-4 p-4 bg-sky-50 rounded-2xl mb-4">
                  <img
                    src={userProfile.avatarUrl || authUser?.user_metadata?.avatar_url || `https://i.pravatar.cc/150?u=${authUser?.id}`}
                    className="w-14 h-14 rounded-full border-2 border-white shadow object-cover"
                    alt="avatar"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 truncate">{userProfile.name}</p>
                    <p className="text-sm text-slate-500">{calculateAgeGroup(userProfile.birthDate)} · {userProfile.gender === 'male' ? '男性' : userProfile.gender === 'female' ? '女性' : userProfile.gender === 'other' ? 'その他' : '回答しない'}</p>
                  </div>
                  <button onClick={openEditProfile} className="p-2 bg-white rounded-full shadow-sm text-sky-500 hover:bg-sky-50 transition">
                    <Edit2 size={18} />
                  </button>
                </div>

                <div className="space-y-3">
                  <button onClick={() => { setIsSettingsOpen(false); handleLogout(); }} className="w-full py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition">
                    <LogOut size={20} /> ログアウト
                  </button>
                  <div className="pt-4 mt-4 border-t border-slate-100">
                    <button onClick={() => { if (window.confirm('本当にアカウントを削除しますか？\nすべてのデータが消えます。')) { setIsSettingsOpen(false); handleDeleteAccount(); } }}
                      className="w-full py-4 bg-rose-50 text-rose-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-rose-100 transition border border-rose-100">
                      <Trash2 size={20} /> アカウントを削除（退会）
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <button onClick={() => setIsEditingProfile(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-2 transition"><X size={20} /></button>
                  <h3 className="text-xl font-bold text-slate-800">プロフィール編集</h3>
                </div>

                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <img
                      src={avatarPreview || userProfile.avatarUrl || authUser?.user_metadata?.avatar_url || `https://i.pravatar.cc/150?u=${authUser?.id}`}
                      className="w-20 h-20 rounded-full border-4 border-sky-100 shadow object-cover"
                      alt="avatar"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 bg-sky-500 text-white rounded-full p-1.5 shadow hover:bg-sky-600 transition"
                    >
                      <Camera size={14} />
                    </button>
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">名前</label>
                    <input
                      type="text" required
                      value={editForm.name}
                      onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">生年月日</label>
                    <input
                      type="date" required
                      value={editForm.birthDate}
                      onChange={e => setEditForm({ ...editForm, birthDate: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">性別</label>
                    <select
                      required
                      value={editForm.gender}
                      onChange={e => setEditForm({ ...editForm, gender: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400"
                    >
                      <option value="" disabled>選択してください</option>
                      <option value="male">男性</option>
                      <option value="female">女性</option>
                      <option value="other">その他</option>
                      <option value="no_answer">回答しない</option>
                    </select>
                  </div>
                  <button type="submit" className="w-full py-4 bg-sky-500 text-white rounded-2xl font-bold hover:bg-sky-600 transition shadow-md mt-2">
                    保存する
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* アバタークロップ */}
      {cropImage && (
        <AvatarCropModal
          imageFile={cropImage}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropImage(null)}
        />
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
              <button onClick={handleDeclineRequest} className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition">見送る</button>
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
