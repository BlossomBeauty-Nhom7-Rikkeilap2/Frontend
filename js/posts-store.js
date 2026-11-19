/**
 * Blossom Beauty Store - Data Store & Local Storage Management
 * Hỗ trợ đồng bộ dữ liệu giữa Staff (Tạo bài, Gửi duyệt, Lịch) và Admin (Phê duyệt, Lịch)
 */

const STORAGE_KEY = 'blossom_posts_data';

const INITIAL_POSTS = [
  {
    id: 1,
    title: 'Bộ sưu tập chăm sóc da thu đông dưỡng ẩm chuyên sâu',
    caption: 'Đón mùa hanh khô với combo dưỡng ẩm hoa hồng từ Blossom Beauty! Giảm ngay 20% khi mua tại hệ thống hoặc đặt hàng online hôm nay.\n\n✨ Thành phần 100% tự nhiên\n✨ Cấp ẩm tầng sâu 72h\n✨ Phù hợp mọi loại da nhạy cảm\n\n#BlossomBeauty #Skincare #DuongAmChuyenSau #GlowSkin',
    platform: 'Facebook · Instagram',
    platforms: ['Facebook', 'Instagram'],
    date: '2026-11-20T10:00',
    status: 'review', // draft | review | edit | ready | done | rejected
    author: 'Nguyễn Phát Đạt',
    authorRole: 'Marketing Staff',
    mediaUrl: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=800&q=80',
    submitNote: 'Đã hoàn thiện nội dung và ảnh banner theo bộ nhận diện mới, kính gửi Chị Minh Anh duyệt ạ.',
    auditLogs: [
      { time: '2026-11-15T09:30', user: 'Nguyễn Phát Đạt', action: 'Tạo bài viết', note: 'Khởi tạo bản nháp' },
      { time: '2026-11-15T10:15', user: 'Nguyễn Phát Đạt', action: 'Gửi duyệt', note: 'Gửi duyệt lần 1' }
    ]
  },
  {
    id: 2,
    title: 'Review Son kem lì Velvet Matte Blossom Bloom #04 Ruby Rose',
    caption: 'Tone đỏ đất cực tôn da, chất son mịn lì như nhung không gây khô môi. Xem ngay video swatch chi tiết bên dưới nhé các nàng! 💄💋\n\n#BlossomMatte #LipstickReview #RubyRose #Trending',
    platform: 'TikTok',
    platforms: ['TikTok'],
    date: '2026-11-17T09:00',
    status: 'edit',
    author: 'Nguyễn Phát Đạt',
    authorRole: 'Marketing Staff',
    mediaUrl: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=800&q=80',
    submitNote: 'Gửi duyệt clip swatch son TikTok ngắn 60s.',
    revisionReason: 'Cần làm rõ thông tin mã màu son ở 3 giây đầu clip và chèn nhạc nền nhẹ nhàng hơn theo tone thương hiệu nhé Đạt.',
    auditLogs: [
      { time: '2026-11-14T14:00', user: 'Nguyễn Phát Đạt', action: 'Tạo bài viết', note: 'Khởi tạo' },
      { time: '2026-11-14T16:00', user: 'Nguyễn Phát Đạt', action: 'Gửi duyệt', note: 'Gửi duyệt video' },
      { time: '2026-11-15T08:00', user: 'Đoàn Thị Minh Anh (Manager)', action: 'Yêu cầu sửa', note: 'Cần làm rõ thông tin mã màu son ở 3 giây đầu clip và chèn nhạc nền nhẹ nhàng hơn theo tone thương hiệu nhé Đạt.' }
    ]
  },
  {
    id: 3,
    title: 'Bí quyết Skincare ban đêm cho làn da căng bóng Glass Skin',
    caption: 'Quy trình 5 bước đơn giản giúp phục hồi hàng rào bảo vệ da trong lúc bạn ngủ. Bạn đã dùng serum đúng thứ tự chưa? Cùng khám phá ngay bí quyết từ chuyên gia Blossom! ✨🌙 #GlassSkin #SkincareRoutine #BeautyTips',
    platform: 'Instagram',
    platforms: ['Instagram'],
    date: '2026-11-22T20:30',
    status: 'draft',
    author: 'Nguyễn Phát Đạt',
    authorRole: 'Marketing Staff',
    mediaUrl: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80',
    submitNote: '',
    auditLogs: [
      { time: '2026-11-15T11:00', user: 'Nguyễn Phát Đạt', action: 'Lưu bản nháp', note: 'Đang soạn thảo nội dung' }
    ]
  },
  {
    id: 4,
    title: 'Siêu Hội Black Friday - Giảm đến 50% toàn bộ Serum cao cấp',
    caption: 'Deal khủng nhất năm chỉ diễn ra trong 3 ngày 27-29/11! Nhanh tay săn deal trước khi cháy hàng nàng nhé. Tag ngay cô bạn thân vào thôi nào! 🔥🛍️ #BlackFriday #BlossomSale #SerumGiamGia',
    platform: 'Facebook',
    platforms: ['Facebook'],
    date: '2026-11-21T19:00',
    status: 'ready',
    author: 'Minh Anh',
    authorRole: 'Marketing Manager',
    mediaUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
    submitNote: 'Bài chiến dịch Black Friday trọng điểm',
    auditLogs: [
      { time: '2026-11-14T10:00', user: 'Minh Anh', action: 'Tạo bài viết', note: 'Chiến dịch Black Friday' },
      { time: '2026-11-14T11:00', user: 'Đoàn Thị Minh Anh (Manager)', action: 'Phê duyệt', note: 'Đã duyệt và đưa vào lịch đăng lúc 19:00 ngày 21/11' }
    ]
  },
  {
    id: 5,
    title: 'Ra mắt bộ cọ trang điểm Blossom Rose Gold Luxury 12 món',
    caption: 'Thiết kế thân cọ ánh hồng sang trọng, sợi cọ thuần chay siêu mịn lướt êm ái trên làn da. Tặng ngay bao đựng da cao cấp cho 50 đơn hàng đầu tiên hôm nay! 🖌️✨ #BlossomBrush #MakeupTools #RoseGold',
    platform: 'Facebook · Instagram',
    platforms: ['Facebook', 'Instagram'],
    date: '2026-11-19T08:30',
    status: 'ready',
    author: 'Nguyễn Phát Đạt',
    authorRole: 'Marketing Staff',
    mediaUrl: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80',
    submitNote: 'Đã liên kết link sản phẩm và ảnh chụp thực tế studio.',
    auditLogs: [
      { time: '2026-11-13T15:00', user: 'Nguyễn Phát Đạt', action: 'Tạo bài viết', note: 'Ra mắt BST cọ' },
      { time: '2026-11-13T17:00', user: 'Đoàn Thị Minh Anh (Manager)', action: 'Phê duyệt', note: 'Duyệt bài đăng sáng 19/11' }
    ]
  },
  {
    id: 6,
    title: 'Top 5 màu son trendy nhất mùa tiệc tùng lễ hội cuối năm 2026',
    caption: 'Từ đỏ cherry quyến rũ đến hồng đất ngọt ngào, cùng Blossom chọn màu son giúp bạn nổi bật trong mọi bữa tiệc! Xem ngay gợi ý trong video ngắn này nhé! 🎥💋 #TopSonTrend #Lipstick2026 #BeautyGuide',
    platform: 'TikTok',
    platforms: ['TikTok'],
    date: '2026-11-18T14:00',
    status: 'review',
    author: 'Nguyễn Phát Đạt',
    authorRole: 'Marketing Staff',
    mediaUrl: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=800&q=80',
    submitNote: 'Video ngắn TikTok format nhanh bắt trend âm nhạc mới.',
    auditLogs: [
      { time: '2026-11-15T08:30', user: 'Nguyễn Phát Đạt', action: 'Gửi duyệt', note: 'Gửi duyệt kịch bản video TikTok' }
    ]
  },
  {
    id: 7,
    title: 'Ưu đãi tháng 11 - Rạng rỡ đón đông cùng Blossom Beauty',
    caption: 'Tặng voucher 50.000đ cho mọi hóa đơn từ 300.000đ khi ghé mua sắm trực tiếp tại showroom Blossom Beauty trên toàn quốc. #BlossomOffer #NovemberDeal #BeautyStore',
    platform: 'Facebook',
    platforms: ['Facebook'],
    date: '2026-11-13T09:00',
    status: 'done',
    author: 'Minh Anh',
    authorRole: 'Marketing Manager',
    mediaUrl: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=800&q=80',
    auditLogs: [
      { time: '2026-11-10T10:00', user: 'Minh Anh', action: 'Xuất bản', note: 'Đã đăng thành công lên Facebook' }
    ]
  }
];

const PostsStore = {
  getPosts() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
    this.savePosts(INITIAL_POSTS);
    return INITIAL_POSTS;
  },

  savePosts(posts) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
      window.dispatchEvent(new Event('blossom_posts_updated'));
    } catch (e) {
      console.error('Save posts error:', e);
    }
  },

  getPostById(id) {
    const posts = this.getPosts();
    return posts.find(p => p.id === Number(id)) || null;
  },

  addPost(post) {
    const posts = this.getPosts();
    const newId = posts.length ? Math.max(...posts.map(p => p.id)) + 1 : 1;
    const newPost = {
      ...post,
      id: newId,
      author: post.author || 'Nguyễn Phát Đạt',
      authorRole: post.authorRole || 'Marketing Staff',
      auditLogs: post.auditLogs || [
        { time: new Date().toISOString(), user: post.author || 'Nguyễn Phát Đạt', action: 'Tạo bài viết', note: 'Tạo bài mới' }
      ]
    };
    posts.unshift(newPost);
    this.savePosts(posts);
    return newPost;
  },

  updatePost(id, patch) {
    const posts = this.getPosts();
    const idx = posts.findIndex(p => p.id === Number(id));
    if (idx !== -1) {
      posts[idx] = { ...posts[idx], ...patch };
      this.savePosts(posts);
      return posts[idx];
    }
    return null;
  },

  deletePost(id) {
    let posts = this.getPosts();
    posts = posts.filter(p => p.id !== Number(id));
    this.savePosts(posts);
    return true;
  },

  // Staff gửi duyệt bài viết (FR-08)
  submitPost(id, submitNote = '') {
    const post = this.getPostById(id);
    if (!post) return null;
    const nowIso = new Date().toISOString();
    const action = (post.status === 'edit' || post.status === 'rejected') ? 'Gửi duyệt lại' : 'Gửi duyệt';
    const updatedLogs = [
      ...(post.auditLogs || []),
      { time: nowIso, user: 'Nguyễn Phát Đạt', action, note: submitNote || 'Gửi Sếp phê duyệt bài viết' }
    ];
    return this.updatePost(id, {
      status: 'review',
      submitNote: submitNote || post.submitNote,
      auditLogs: updatedLogs
    });
  },

  // Staff thu hồi bài viết khi đang chờ duyệt (+1 điểm thưởng)
  withdrawPost(id) {
    const post = this.getPostById(id);
    if (!post) return null;
    if (post.status !== 'review') {
      throw new Error('Chỉ có thể thu hồi bài viết đang ở trạng thái Chờ duyệt!');
    }
    const updatedLogs = [
      ...(post.auditLogs || []),
      { time: new Date().toISOString(), user: 'Nguyễn Phát Đạt', action: 'Thu hồi bài viết', note: 'Nhân viên chủ động thu hồi về Bản nháp để chỉnh sửa' }
    ];
    return this.updatePost(id, {
      status: 'draft',
      auditLogs: updatedLogs
    });
  },

  // Manager phê duyệt bài viết (FR-09)
  approvePost(id, managerNote = '') {
    const post = this.getPostById(id);
    if (!post) return null;
    const updatedLogs = [
      ...(post.auditLogs || []),
      { time: new Date().toISOString(), user: 'Đoàn Thị Minh Anh (Manager)', action: 'Phê duyệt', note: managerNote || 'Đã duyệt nội dung và đồng bộ lịch phát hành' }
    ];
    return this.updatePost(id, {
      status: 'ready',
      revisionReason: '',
      auditLogs: updatedLogs
    });
  },

  // Manager yêu cầu sửa lại bài viết (FR-10)
  requestRevision(id, reason) {
    if (!reason || !reason.trim()) {
      throw new Error('Vui lòng nhập lý do / góp ý yêu cầu chỉnh sửa!');
    }
    const post = this.getPostById(id);
    if (!post) return null;
    const updatedLogs = [
      ...(post.auditLogs || []),
      { time: new Date().toISOString(), user: 'Đoàn Thị Minh Anh (Manager)', action: 'Yêu cầu sửa', note: reason.trim() }
    ];
    return this.updatePost(id, {
      status: 'edit',
      revisionReason: reason.trim(),
      auditLogs: updatedLogs
    });
  },

  // Manager từ chối bài viết (FR-10)
  rejectPost(id, reason) {
    if (!reason || !reason.trim()) {
      throw new Error('Vui lòng nhập lý do từ chối bài viết!');
    }
    const post = this.getPostById(id);
    if (!post) return null;
    const updatedLogs = [
      ...(post.auditLogs || []),
      { time: new Date().toISOString(), user: 'Đoàn Thị Minh Anh (Manager)', action: 'Từ chối', note: reason.trim() }
    ];
    return this.updatePost(id, {
      status: 'rejected',
      revisionReason: reason.trim(),
      auditLogs: updatedLogs
    });
  },

  // Kiểm tra xung đột lịch đăng < 30 phút cùng nền tảng (FR-11)
  checkConflict(platform, targetTimeIso, excludePostId = null) {
    if (!targetTimeIso || !platform) return null;
    const targetDate = new Date(targetTimeIso);
    const targetTs = targetDate.getTime();
    if (isNaN(targetTs)) return null;

    const posts = this.getPosts().filter(p => p.id !== Number(excludePostId) && p.status !== 'rejected');
    const targetPlatforms = Array.isArray(platform) ? platform : platform.split('·').map(s => s.trim());

    for (const p of posts) {
      if (!p.date) continue;
      const pDate = new Date(p.date);
      const pTs = pDate.getTime();
      const diffMinutes = Math.abs(pTs - targetTs) / (1000 * 60);

      if (diffMinutes < 30) {
        const postPlatforms = Array.isArray(p.platforms) ? p.platforms : (p.platform || '').split('·').map(s => s.trim());
        const hasOverlap = targetPlatforms.some(tp => postPlatforms.some(pp => pp.toLowerCase() === tp.toLowerCase()));
        if (hasOverlap) {
          return {
            conflictingPost: p,
            diffMinutes: Math.round(diffMinutes),
            suggestedTime: new Date(pTs + 31 * 60 * 1000).toISOString().slice(0, 16)
          };
        }
      }
    }
    return null;
  }
};

window.PostsStore = PostsStore;
