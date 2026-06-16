// =======================================================
// نظام المستخدمين - البيانات تُخزن في الكود وليس localStorage
// هذا يضمن أن أي شخص يفتح الموقع يرى نفس الحسابات
// =======================================================

let systemUsers = JSON.parse(localStorage.getItem('systemUsers')) || [
    { username: 'admin', password: 'admin123', role: 'owner' }
];

function saveSystemUsers() {
    localStorage.setItem('systemUsers', JSON.stringify(systemUsers));
}

if (!localStorage.getItem('branches')) localStorage.setItem('branches', JSON.stringify([]));
if (!localStorage.getItem('employees')) localStorage.setItem('employees', JSON.stringify([]));
if (!localStorage.getItem('logs')) localStorage.setItem('logs', JSON.stringify([]));

let currentUser = null;
let activeBranchContext = "";

document.getElementById('password').addEventListener('keypress', function(e) { if (e.key === 'Enter') login(); });
document.getElementById('username').addEventListener('keypress', function(e) { if (e.key === 'Enter') login(); });

function addLog(action, details) {
    const logs = JSON.parse(localStorage.getItem('logs')) || [];
    const now = new Date();
    const timeString = now.toLocaleDateString('ar-EG') + ' | ' + now.toLocaleTimeString('ar-EG');
    logs.unshift({
        time: timeString,
        user: currentUser ? currentUser.username : 'النظام',
        action: action,
        details: details
    });
    localStorage.setItem('logs', JSON.stringify(logs));
}

function clearLogs() {
    if(confirm("⚠️ هل أنت متأكد من مسح جميع سجلات العمليات نهائياً من النظام؟")) {
        localStorage.setItem('logs', JSON.stringify([]));
        addLog('تصفية السجل', 'قام المالك بمسح وتصفية سجل اللوجات بالكامل');
        renderSystemData();
    }
}

function login() {
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('password').value.trim();

    if (!u || !p) {
        showAlert('يرجى إدخال اسم المستخدم وكلمة المرور!', 'warning');
        return;
    }

    const found = systemUsers.find(user => user.username === u && user.password === p);

    if (found) {
        currentUser = found;
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('dashboardPage').style.display = 'grid';

        document.getElementById('welcomeMsg').innerText = `مرحباً بك، ${found.username} 👋`;
        document.getElementById('userRoleBadge').innerText = found.role === 'owner' ? 'مالك الصلاحيات المطلقة (Owner)' : 'محاسب مالي (Accountant)';

        if (found.role !== 'owner') {
            document.querySelectorAll('.owner-only-btn').forEach(el => el.style.display = 'none');
        } else {
            document.querySelectorAll('.owner-only-btn').forEach(el => el.style.display = 'flex');
        }

        addLog('تسجيل دخول', `قام بالدخول إلى لوحة التحكم بنجاح من جهاز مختلف`);
        renderSystemData();
        switchSection('overview');
    } else {
        showAlert('عذراً، اسم المستخدم أو كلمة المرور خاطئة!', 'error');
    }
}

function logout() {
    addLog('تسجيل خروج', 'قام بتسجيل الخروج من النظام');
    currentUser = null;
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('dashboardPage').style.display = 'none';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

function showAlert(message, type = 'info') {
    const existing = document.getElementById('customAlert');
    if (existing) existing.remove();

    const colors = {
        info: { bg: '#e0f2fe', border: '#0284c7', text: '#0369a1', icon: 'ℹ️' },
        success: { bg: '#d1fae5', border: '#10b981', text: '#065f46', icon: '✅' },
        warning: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e', icon: '⚠️' },
        error: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b', icon: '❌' }
    };
    const c = colors[type] || colors.info;

    const div = document.createElement('div');
    div.id = 'customAlert';
    div.style.cssText = `
        position: fixed; top: 24px; left: 50%; transform: translateX(-50%);
        background: ${c.bg}; border: 2px solid ${c.border}; color: ${c.text};
        padding: 16px 32px; border-radius: 12px; font-size: 15px; font-weight: 700;
        box-shadow: 0 8px 24px rgba(0,0,0,0.18); z-index: 9999;
        display: flex; align-items: center; gap: 10px; font-family: 'Cairo', sans-serif;
        direction: rtl; max-width: 420px; text-align: center;
        animation: slideDown 0.3s ease;
    `;
    div.innerHTML = `<span style="font-size:20px;">${c.icon}</span> ${message}`;
    document.body.appendChild(div);
    setTimeout(() => { if(div) div.remove(); }, 3500);
}

if (!document.getElementById('alertStyle')) {
    const style = document.createElement('style');
    style.id = 'alertStyle';
    style.textContent = `@keyframes slideDown { from { opacity:0; transform:translateX(-50%) translateY(-20px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`;
    document.head.appendChild(style);
}

function switchSection(sectionId) {
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active-section'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active-section');
    const targetBtn = Array.from(document.querySelectorAll('.nav-btn')).find(btn => btn.getAttribute('onclick')?.includes(sectionId));
    if(targetBtn) targetBtn.classList.add('active');
}

function openSpecificBranchView(branchName) {
    activeBranchContext = branchName;
    const branches = JSON.parse(localStorage.getItem('branches'));
    const currentBranch = branches.find(b => b.name === branchName);
    if(!currentBranch) return;

    document.getElementById('selectedBranchTitle').innerText = `🏢 إدارة وتحكم: ${currentBranch.name}`;
    document.getElementById('selectedBranchManagerInfo').innerText = `المدير المسؤول للفرع: ${currentBranch.manager} | راتب المدير: ${currentBranch.salary} $`;
    document.getElementById('addEmpToBranchHeading').innerText = `➕ توظيف عامل جديد في (${currentBranch.name}) مباشرة`;

    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    const targetBtn = document.getElementById(`sidebar-btn-${branchName}`);
    if(targetBtn) targetBtn.classList.add('active');

    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active-section'));
    document.getElementById('singleBranchView').classList.add('active-section');
    renderSpecificBranchEmployees();
}

function renderSystemData() {
    const branches = JSON.parse(localStorage.getItem('branches'));
    const employees = JSON.parse(localStorage.getItem('employees'));
    const logs = JSON.parse(localStorage.getItem('logs')) || [];

    document.getElementById('statBranchesCount').innerText = branches.length;
    document.getElementById('statEmployeesCount').innerText = employees.length;
    let totalSalariesSum = 0;
    branches.forEach(b => totalSalariesSum += Number(b.salary || 0));
    employees.forEach(e => totalSalariesSum += Number(e.salary || 0));
    document.getElementById('statTotalSalaries').innerText = totalSalariesSum.toLocaleString('ar-EG') + " $";

    const sidebarBranchesList = document.getElementById('sidebarBranchesList');
    sidebarBranchesList.innerHTML = '';
    if(branches.length === 0) {
        sidebarBranchesList.innerHTML = '<div style="font-size:12px; padding:10px 15px; color:#64748b;">لا توجد فروع مضافة حالياً</div>';
    } else {
        branches.forEach(b => {
            sidebarBranchesList.innerHTML += `
                <button class="nav-btn" id="sidebar-btn-${b.name}" onclick="openSpecificBranchView('${b.name}')">
                    🔹 ${b.name}
                </button>`;
        });
    }

    const allBranchesTable = document.getElementById('allBranchesTable');
    allBranchesTable.innerHTML = '';
    if(branches.length === 0) {
        allBranchesTable.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#64748b; padding:20px;">لا توجد فروع مضافة بعد.</td></tr>';
    } else {
        branches.forEach((b, index) => {
            allBranchesTable.innerHTML += `
                <tr>
                    <td style="font-weight:600;">${b.name}</td>
                    <td>${b.manager}</td>
                    <td><span style="color:var(--success); font-weight:700;">${Number(b.salary).toLocaleString('ar-EG')} $</span></td>
                    <td>
                        <button class="btn btn-danger" style="padding:5px 12px; font-size:12px;" onclick="deleteBranch(${index})">❌ حذف الفرع</button>
                    </td>
                </tr>`;
        });
    }

    const globalEmployeesTable = document.getElementById('globalEmployeesTable');
    globalEmployeesTable.innerHTML = '';
    if(employees.length === 0) {
        globalEmployeesTable.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#64748b; padding:20px;">لا يوجد عمال مسجلون في الشركة حالياً.</td></tr>';
    } else {
        employees.forEach((emp, index) => {
            globalEmployeesTable.innerHTML += `
                <tr>
                    <td><b>${emp.name}</b></td>
                    <td>${emp.phone}</td>
                    <td><span style="background:#e0f2fe; color:#0369a1; padding:4px 8px; border-radius:6px; font-size:12px; font-weight:600;">${emp.branch}</span></td>
                    <td>${Number(emp.salary).toLocaleString('ar-EG')} $</td>
                    <td><span class="badge ${emp.status === 'نشط' ? 'badge-success' : 'badge-warning'}">${emp.status}</span></td>
                    <td>
                        <button class="btn btn-primary" style="padding:4px 10px; font-size:11px;" onclick="openSpecificBranchView('${emp.branch}')">اذهب للفرع</button>
                        <button class="btn" style="padding:4px 10px; font-size:11px; background-color: #8b5cf6; color: white;" onclick="generateInvoice(${index})">💵 فاتورة</button>
                    </td>
                </tr>`;
        });
    }

    const systemUsersTableBody = document.getElementById('systemUsersTableBody');
    systemUsersTableBody.innerHTML = '';
    systemUsers.forEach((user, index) => {
        const isProtected = user.username === 'admin' || (currentUser && user.username === currentUser.username);
        systemUsersTableBody.innerHTML += `
            <tr>
                <td><b>${user.username}</b></td>
                <td><span style="color: ${user.role === 'owner' ? 'var(--primary)' : 'var(--warning)'}; font-weight:700;">${user.role === 'owner' ? '👑 مالك (Owner)' : '📊 محاسب (Accountant)'}</span></td>
                <td>
                    ${isProtected ?
                        `<span style="color:#a8a29e; font-size:12px; font-style:italic;">🔒 حساب محمي</span>` :
                        `<button class="btn btn-danger" style="padding:5px 12px; font-size:12px;" onclick="deleteUserAccount(${index})">❌ حذف الحساب</button>`
                    }
                </td>
            </tr>`;
    });

    const logsTableBody = document.getElementById('logsTableBody');
    logsTableBody.innerHTML = '';
    if (logs.length === 0) {
        logsTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#64748b; padding:20px;">لا توجد عمليات مسجلة حالياً.</td></tr>';
    } else {
        logs.forEach(log => {
            let badgeColor = 'var(--primary)';
            if(log.action.includes('حذف') || log.action.includes('فصل')) badgeColor = 'var(--danger)';
            if(log.action.includes('إنشاء') || log.action.includes('توظيف') || log.action.includes('صناعة')) badgeColor = 'var(--success)';
            if(log.action.includes('تعديل') || log.action.includes('تغيير')) badgeColor = 'var(--warning)';
            logsTableBody.innerHTML += `
                <tr>
                    <td style="color:#64748b; font-size:13px;">${log.time}</td>
                    <td><b style="color:var(--sidebar-bg);">${log.user}</b></td>
                    <td><span class="badge" style="background-color:${badgeColor};">${log.action}</span></td>
                    <td style="font-weight:600; color:#475569;">${log.details}</td>
                </tr>`;
        });
    }
}

function deleteBranch(index) {
    const branches = JSON.parse(localStorage.getItem('branches'));
    const employees = JSON.parse(localStorage.getItem('employees'));
    const branchName = branches[index].name;

    if (confirm(`⚠️ تحذير إداري هام:\nهل أنت متأكد من حذف فرع (${branchName})؟\nسيؤدي ذلك إلى حذف جميع العمال التابعين له!`)) {
        branches.splice(index, 1);
        localStorage.setItem('branches', JSON.stringify(branches));

        const remainingEmployees = employees.filter(emp => emp.branch !== branchName);
        localStorage.setItem('employees', JSON.stringify(remainingEmployees));

        addLog('حذف فرع', `تم حذف فرع (${branchName}) بالكامل وتصفية كافة طاقم عماله`);
        showAlert(`تم حذف فرع (${branchName}) وعماله بنجاح.`, 'success');

        if (activeBranchContext === branchName) {
            activeBranchContext = "";
            switchSection('overview');
        }
        renderSystemData();
    }
}

function deleteUserAccount(index) {
    const user = systemUsers[index];
    if (!user) return;
    const accountName = user.username;

    if (confirm(`⚠️ هل أنت متأكد من حذف الحساب (${accountName})؟`)) {
        systemUsers.splice(index, 1);
        saveSystemUsers();
        addLog('حذف حساب', `تم حذف الحساب (${accountName}) وإلغاء صلاحياته`);
        showAlert(`تم حذف حساب (${accountName}) بنجاح.`, 'success');
        renderSystemData();
    }
}

function renderSpecificBranchEmployees() {
    const employees = JSON.parse(localStorage.getItem('employees'));
    const branchEmployees = employees.map((emp, idx) => ({...emp, originalIndex: idx})).filter(emp => emp.branch === activeBranchContext);
    const table = document.getElementById('branchSpecificEmployeesTable');
    table.innerHTML = '';

    if(branchEmployees.length === 0) {
        table.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#64748b; padding:20px;">لا يوجد عمال في هذا الفرع حالياً.</td></tr>';
        return;
    }

    branchEmployees.forEach(emp => {
        table.innerHTML += `
            <tr>
                <td><input type="text" value="${emp.name}" id="sbEditName-${emp.originalIndex}" style="padding:6px 10px;"></td>
                <td><input type="text" value="${emp.phone}" id="sbEditPhone-${emp.originalIndex}" style="padding:6px 10px;"></td>
                <td><input type="number" value="${emp.salary}" id="sbEditSalary-${emp.originalIndex}" style="padding:6px 10px; width:100px;"> $</td>
                <td><span class="badge ${emp.status === 'نشط' ? 'badge-success' : 'badge-warning'}">${emp.status}</span></td>
                <td>
                    <button class="btn btn-primary" style="padding:6px 12px; font-size:12px;" onclick="updateEmployeeData(${emp.originalIndex})">💾 حفظ</button>
                    <button class="btn btn-warning" style="padding:6px 12px; font-size:12px;" onclick="toggleEmployeeVacation(${emp.originalIndex})">🌴 إجازة/نشط</button>
                    <button class="btn btn-danger" style="padding:6px 12px; font-size:12px;" onclick="fireEmployeeFromBranch(${emp.originalIndex})">❌ فصل</button>
                    <button class="btn" style="padding:6px 12px; font-size:12px; background-color: #8b5cf6; color: white;" onclick="generateInvoice(${emp.originalIndex})">💵 فاتورة</button>
                </td>
            </tr>`;
    });
}

function createNewBranch() {
    const name = document.getElementById('branchName').value.trim();
    const manager = document.getElementById('branchManager').value.trim();
    const salary = document.getElementById('branchManagerSalary').value.trim();

    if(!name || !manager || !salary) return showAlert('الرجاء تعبئة كافة حقول تأسيس الفرع!', 'warning');

    const branches = JSON.parse(localStorage.getItem('branches'));
    if(branches.find(b => b.name.toLowerCase() === name.toLowerCase())) return showAlert('هذا الفرع موجود مسبقاً!', 'warning');

    branches.push({ name, manager, salary });
    localStorage.setItem('branches', JSON.stringify(branches));

    addLog('إنشاء فرع', `تأسيس فرع جديد (${name}) وإسناد إدارته لـ: ${manager}`);
    showAlert(`تم تأسيس فرع (${name}) بنجاح!`, 'success');
    renderSystemData();

    document.getElementById('branchName').value = '';
    document.getElementById('branchManager').value = '';
    document.getElementById('branchManagerSalary').value = '';
}

function createNewUserAccount() {
    const u = document.getElementById('newUsername').value.trim();
    const p = document.getElementById('newPassword').value.trim();
    const r = document.getElementById('newRole').value;

    if(!u || !p) return showAlert('يرجى ملء اسم المستخدم وكلمة المرور!', 'warning');
    if(p.length < 4) return showAlert('كلمة المرور يجب أن تكون 4 أحرف على الأقل!', 'warning');

    if(systemUsers.find(user => user.username === u)) return showAlert('اسم المستخدم مستخدم مسبقاً!', 'warning');

    systemUsers.push({ username: u, password: p, role: r });
    saveSystemUsers();

    addLog('صناعة حساب', `إنشاء حساب جديد (${u}) بصلاحية: ${r === 'owner' ? 'مالك' : 'محاسب مالي'}`);
    showAlert(`✅ تم إنشاء حساب (${u}) بنجاح! يمكنه الآن تسجيل الدخول من أي جهاز.`, 'success');
    renderSystemData();

    document.getElementById('newUsername').value = '';
    document.getElementById('newPassword').value = '';
}

function addEmployeeToCurrentBranch() {
    const name = document.getElementById('sbEmpName').value.trim();
    const phone = document.getElementById('sbEmpPhone').value.trim();
    const salary = document.getElementById('sbEmpSalary').value.trim();

    if(!name || !phone || !salary) return showAlert('يرجى تعبئة كامل بيانات العامل!', 'warning');

    const employees = JSON.parse(localStorage.getItem('employees'));
    employees.push({ name, phone, salary, branch: activeBranchContext, status: 'نشط' });
    localStorage.setItem('employees', JSON.stringify(employees));

    addLog('توظيف عامل', `تعيين العامل (${name}) براتب ${salary}$ في فرع (${activeBranchContext})`);
    showAlert(`تم توظيف (${name}) في فرع: ${activeBranchContext}`, 'success');

    document.getElementById('sbEmpName').value = '';
    document.getElementById('sbEmpPhone').value = '';
    document.getElementById('sbEmpSalary').value = '';

    renderSystemData();
    renderSpecificBranchEmployees();
}

function updateEmployeeData(index) {
    const employees = JSON.parse(localStorage.getItem('employees'));
    const oldName = employees[index].name;

    employees[index].name = document.getElementById(`sbEditName-${index}`).value.trim();
    employees[index].phone = document.getElementById(`sbEditPhone-${index}`).value.trim();
    employees[index].salary = document.getElementById(`sbEditSalary-${index}`).value.trim();

    localStorage.setItem('employees', JSON.stringify(employees));
    addLog('تعديل بيانات', `تحديث بيانات العامل (${oldName}) في فرع (${employees[index].branch})`);
    showAlert('تم حفظ التعديلات بنجاح!', 'success');
    renderSystemData();
    renderSpecificBranchEmployees();
}

function toggleEmployeeVacation(index) {
    const employees = JSON.parse(localStorage.getItem('employees'));
    employees[index].status = employees[index].status === 'نشط' ? 'في إجازة' : 'نشط';
    localStorage.setItem('employees', JSON.stringify(employees));
    addLog('تغيير حالة', `تعديل وضعية (${employees[index].name}) إلى [${employees[index].status}]`);
    renderSystemData();
    renderSpecificBranchEmployees();
}

function fireEmployeeFromBranch(index) {
    if(confirm("هل أنت متأكد من قرار فصل هذا العامل؟")) {
        const employees = JSON.parse(localStorage.getItem('employees'));
        const empName = employees[index].name;
        const empBranch = employees[index].branch;
        employees.splice(index, 1);
        localStorage.setItem('employees', JSON.stringify(employees));
        addLog('فصل عامل', `تم فصل الموظف (${empName}) من فرع (${empBranch})`);
        showAlert(`تم فصل العامل (${empName}) بنجاح.`, 'success');
        renderSystemData();
        renderSpecificBranchEmployees();
    }
}

// دالة توليد فاتورة الراتب والطباعة كـ PDF
function generateInvoice(index) {
    const employees = JSON.parse(localStorage.getItem('employees'));
    const branches = JSON.parse(localStorage.getItem('branches'));
    const emp = employees[index];
    if (!emp) return;

    const branchInfo = branches.find(b => b.name === emp.branch) || { manager: 'مدير النظام', salary: 0 };

    const deductionsStr = prompt(`💵 إصدار فاتورة راتب لـ (${emp.name})\nأدخل إجمالي الخصومات (غياب / سلف) بالدولار $ (أدخل 0 إذا لم يكن هناك خصم):`, "0");
    if (deductionsStr === null) return;
    
    const deductions = Number(deductionsStr) || 0;
    const basicSalary = Number(emp.salary) || 0;
    const netSalary = basicSalary - deductions;

    const now = new Date();
    const dateString = now.toLocaleDateString('ar-EG') + ' - ' + now.toLocaleTimeString('ar-EG');

    const invoiceHtml = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <title>فاتورة راتب - ${emp.name}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
            body { font-family: 'Cairo', sans-serif; direction: rtl; padding: 40px; color: #1e293b; background: white; }
            .invoice-box { max-width: 800px; margin: auto; border: 2px solid #e2e8f0; padding: 30px; border-radius: 12px; position: relative; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0284c7; padding-bottom: 20px; margin-bottom: 30px; }
            .company-name { font-size: 24px; font-weight: 700; color: #0f172a; }
            .invoice-title { font-size: 26px; font-weight: 700; color: #0284c7; text-align: center; margin: 20px 0; letter-spacing: 1px; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; }
            .meta-item { font-size: 15px; }
            .meta-item strong { color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            th { background-color: #0284c7; color: white; padding: 12px; font-weight: 700; text-align: right; }
            td { padding: 14px; border-bottom: 1px solid #e2e8f0; font-size: 15px; }
            .total-row { font-weight: 700; background: #f0fdf4; }
            .total-row td { color: #16a34a; font-size: 18px; border-top: 2px solid #16a34a; }
            .footer-signatures { display: flex; justify-content: space-between; align-items: center; margin-top: 60px; }
            .signature-block { text-align: center; width: 220px; }
            .signature-line { border-bottom: 1px dashed #64748b; margin-top: 50px; margin-bottom: 10px; }
            
            .stamp-box { width: 110px; height: 110px; border: 3px double #ef4444; border-radius: 50%; display: flex; flex-direction: column; justify-content: center; align-items: center; color: #ef4444; font-weight: 700; font-size: 11px; transform: rotate(-12deg); opacity: 0.85; margin: auto; box-shadow: 0 0 4px rgba(239, 68, 68, 0.2); }
            
            .btn-print { background: #10b981; color: white; border: none; padding: 12px 30px; font-size: 16px; font-weight: 700; border-radius: 8px; cursor: pointer; display: block; margin: 30px auto 0 auto; font-family: 'Cairo', sans-serif; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            
            @media print {
                body { padding: 0; }
                .invoice-box { border: none; padding: 0; }
                .btn-print { display: none; }
            }
        </style>
    </head>
    <body>
        <div class="invoice-box">
            <div class="header">
                <div>
                    <div class="company-name">شركة خواص الذكية</div>
                    <div style="color: #64748b; font-size: 13px; margin-top: 5px;">Al-Hayat Co. for Cosmetics</div>
                </div>
                <div style="text-align: left; font-size: 14px; color: #475569;">
                    <div><strong>تاريخ الإصدار:</strong> ${dateString}</div>
                    <div><strong>الرقم المرجعي:</strong> KH-${Math.floor(100000 + Math.random() * 900000)}</div>
                </div>
            </div>

            <div class="invoice-title">مستند صرف راتب شهري</div>

            <div class="meta-grid">
                <div class="meta-item"><strong>اسم الموظف:</strong> ${emp.name}</div>
                <div class="meta-item"><strong>الفرع التابع له:</strong> ${emp.branch}</div>
                <div class="meta-item"><strong>رقم الهاتف:</strong> ${emp.phone}</div>
                <div class="meta-item"><strong>المدير المسؤول:</strong> ${branchInfo.manager}</div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>الوصف والبند المالي</th>
                        <th style="text-align: left;">القيمة المستحقة</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>الراتب الأساسي المعتمد</td>
                        <td style="text-align: left; font-weight: 600; color: #0f172a;">${basicSalary.toLocaleString('ar-EG')} $</td>
                    </tr>
                    <tr>
                        <td>الإستقطاعات والخصومات الإدارية (غياب / سلف)</td>
                        <td style="text-align: left; font-weight: 600; color: #dc2626;">-${deductions.toLocaleString('ar-EG')} $</td>
                    </tr>
                    <tr class="total-row">
                        <td>صافي الراتب النهائي الجاهز للصرف</td>
                        <td style="text-align: left;">${netSalary.toLocaleString('ar-EG')} $</td>
                    </tr>
                </tbody>
            </table>

            <div class="footer-signatures">
                <div class="signature-block">
                    <div>توقيع اعتماد مدير الفرع</div>
                    <div class="signature-line"></div>
                    <div style="font-size: 13px; color: #64748b;">${branchInfo.manager}</div>
                </div>
                
                <div class="signature-block">
                    <div class="stamp-box">
                        <div>شركة خواص</div>
                        <div style="font-size: 8px; margin: 2px 0; color:#ef4444; letter-spacing:1px;">صُرف وجُهّز</div>
                        <div style="font-size: 9px;">Al-Hayat Co.</div>
                    </div>
                </div>

                <div class="signature-block">
                    <div>توقيع الموظف بالاستلام</div>
                    <div class="signature-line"></div>
                    <div style="font-size: 13px; color: #64748b;">${emp.name}</div>
                </div>
            </div>
        </div>
        
        <button class="btn-print" onclick="window.print()">🖨️ طباعة الفاتورة أو حفظ كـ PDF</button>
    </body>
    </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
    
    addLog('إصدار فاتورة', `تم إنشاء مسير رواتب للموظف (${emp.name}) بخصم ${deductions}$ والصافي ${netSalary}$`);
}