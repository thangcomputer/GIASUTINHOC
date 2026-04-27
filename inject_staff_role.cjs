const fs = require('fs');

let content = fs.readFileSync('src/pages/AdminDashboard.jsx', 'utf8');

// 1. Chèn allowed NAV_ITEMS
const navItemsRegex = /const NAV_ITEMS = \[\s*\{ id: 'overview'[\s\S]*?\}\s*\]/;
const newNavItems = `let NAV_ITEMS = [
    { id: 'overview',  icon: <BarChart2 size={20}/>,     label: 'Tổng Quan' },
    { id: 'users',     icon: <Users size={20}/>,         label: 'Người Dùng' },
    { id: 'billing',   icon: <CreditCard size={20}/>,   label: 'Giao Dịch' },
    { id: 'chatlog',   icon: <MessageSquare size={20}/>, label: 'Hỏi Đáp AI' },
    { id: 'advisor',   icon: <Bot size={20}/>,           label: 'Nội Dung Tư Vấn' },
    { id: 'knowledge', icon: <Database size={20}/>,      label: 'Huấn Luyện AI' },
    { id: 'cms',       icon: <BookOpen size={20}/>,      label: 'Nội Dung CMS' },
    { id: 'exams',     icon: <FileText size={20}/>,      label: 'Chấm Bài Thi' },
    { id: 'popups',    icon: <Bell size={20}/>,          label: 'Popup Thông Báo' },
    { id: 'settings',  icon: <Settings size={20}/>,     label: 'Cấu Hình' },
  ];

  if (admin?.role === 'staff') {
     const allowedTabs = ['overview', 'popups', 'billing', 'advisor', 'users'];
     NAV_ITEMS = NAV_ITEMS.filter(item => allowedTabs.includes(item.id));
  }`;
content = content.replace(navItemsRegex, newNavItems);

// 2. Chèn Add User state handlers
const stateHooksInjection = `// States for Add User
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'student' });
  const [addLoading, setAddLoading] = useState(false);

  const handleAddUser = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      const res = await fetch('/api/users/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      const data = await res.json();
      if (data.success) {
         Swal.fire('Thành công', 'Thêm mới người dùng thành công', 'success');
         setShowAddUserModal(false);
         setNewUser({ name: '', email: '', password: '', role: 'student' });
         fetchUsers(); // Tải lại danh sách
      } else {
         Swal.fire('Lỗi', data.message, 'error');
      }
    } catch(err) {
      Swal.fire('Lỗi', 'Không thể kết nối đến server', 'error');
    }
    setAddLoading(false);
  };
`;
// Inject after `const [resetLoading, setResetLoading]   = useState(false)`
content = content.replace("const [resetLoading, setResetLoading]   = useState(false)", "const [resetLoading, setResetLoading]   = useState(false)\n" + stateHooksInjection);

// 3. Inject Button "Thêm Người Dùng" in "Quản Lý Người Dùng" header
const addUserBtnRegex = /<h2><Users size={28} color="#6366f1" \/> Quản Lý Người Dùng<\/h2>/;
const addUserBtnReplacement = `<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2><Users size={28} color="#6366f1" /> Quản Lý Người Dùng</h2>
              <button onClick={() => setShowAddUserModal(true)} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <Plus size={18} /> THÊM NGƯỜI DÙNG
              </button>
            </div>`;
content = content.replace(addUserBtnRegex, addUserBtnReplacement);

// 4. Inject Modal for Adding User
// We will inject it near the end of the return statement, before final `</div>` of `.admin-dashboard`.
const addUserModal = `
      {/* ── Modal Add User ── */}
      {showAddUserModal && (
        <div className="admin-modal-overlay" onClick={() => setShowAddUserModal(false)}>
          <div className="admin-modal glass-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Thêm Người Dùng Mới</h3>
            </div>
            <form onSubmit={handleAddUser} style={{ padding: '20px' }}>
              <div className="admin-input-group" style={{ marginBottom: '15px' }}>
                 <label>Họ và Tên</label>
                 <input type="text" required value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px' }} />
              </div>
              <div className="admin-input-group" style={{ marginBottom: '15px' }}>
                 <label>Email liên hệ</label>
                 <input type="email" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px' }} />
              </div>
              <div className="admin-input-group" style={{ marginBottom: '15px' }}>
                 <label>Mật khẩu (trống sẽ mặc định 123456)</label>
                 <input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px' }} />
              </div>
              <div className="admin-input-group" style={{ marginBottom: '25px' }}>
                 <label>Quyền hạn Role</label>
                 <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px' }}>
                   <option value="student">Học Viên</option>
                   {admin?.role !== 'staff' && (
                     <>
                        <option value="staff">Nhân Viên</option>
                        <option value="admin">Quản Trị Viên</option>
                     </>
                   )}
                 </select>
                 {admin?.role === 'staff' && <small style={{ color: '#94a3b8', display: 'block', marginTop: '5px' }}>Nhân viên chỉ được phép tạo Học Viên.</small>}
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowAddUserModal(false)}>Hủy</button>
                <button type="submit" className="btn-submit" disabled={addLoading}>
                  {addLoading ? 'Đang tạo...' : 'Xác nhận tạo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
`;

content = content.replace("      {/* ── Modal Footer Edit ── */}", addUserModal + "\n      {/* ── Modal Footer Edit ── */}");

fs.writeFileSync('src/pages/AdminDashboard.jsx', content);
console.log('Update Success!');
