// التخزين المحلي والبيانات الأولية الافتراضية
if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify([{ username: 'admin', password: 'admin123', role: 'owner' }]));
}
if (!localStorage.getItem('branches')) localStorage.setItem('branches', JSON.stringify([]));
if (!localStorage.getItem('employees')) localStorage.setItem('employees', JSON.stringify([]));
if (!localStorage.getItem('logs')) localStorage.setItem('logs', JSON.stringify([]));

let currentUser = null;
let activeBranchContext = ""; // لحفظ اسم الفرع النشط حالياً في لوحته المستقلة

// دعم تسجيل الدخول بالضغط على Enter
document.getElementById('password').addEventListener('keypress', function(e) { if (e.key === 'Enter') login(); });
document.getElementById('username').addEventListener('keypress', function(e) { if (e.key === 'Enter') login(); });

// نظام تسجيل اللوجات التلقائي
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

// مسح سجل العمليات بالكامل (للمالك)
function clearLogs() {
    if(confirm("⚠️ هل أنت متأكد من مسح جميع سجلات العمليات نهائياً من النظام؟")) {
        localStorage.setItem('logs', JSON.stringify([]));
        addLog('تصفية السجل', 'قام المالك بمسح وتصفية سجل اللوجات بالكامل');
        renderSystemData();
    }
}

// تسجيل الدخول والتحقق
function login() {
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('password').value.trim();
    const users = JSON.parse(localStorage.getItem('users'));

    const found = users.find(user => user.username === u && user.password === p);

    if (found) {
        currentUser = found;
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('dashboardPage').style.display = 'grid';
        
        document.getElementById('welcomeMsg').innerText = `مرحباً بك، ${found.username} 👋`;
        document.getElementById('userRoleBadge').innerText = found.role === 'owner' ? 'مالك الصلاحيات المطلقة (Owner)' : 'محاسب مالي (Accountant)';
        
        // عزل أزرار المالك عن المحاسب فقط في القائمة الجانبية دون لمس الأقسام الرئيسية
        if (found.role !== 'owner') {
            document.querySelectorAll('.owner-only-btn').forEach(el => el.style.display = 'none');
        } else {
            document.querySelectorAll('.owner-only-btn').forEach(el => el.style.display = 'flex');
        }
        
        addLog('تسجيل دخول', 'قام بالدخول إلى لوحة التحكم بنجاح');
        renderSystemData();
        switchSection('overview');
    } else {
        alert('عذراً، اسم المستخدم أو كلمة المرور خاطئة!');
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

// تحويل الأقسام الرئيسية بشكل آمن ونظيف
function switchSection(sectionId) {
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active-section'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(sectionId).classList.add('active-section');
    
    // تحديد الزر النشط إذا وُجد
    const targetBtn = Array.from(document.querySelectorAll('.nav-btn')).find(btn => btn.getAttribute('onclick')?.includes(sectionId));
    if(targetBtn) targetBtn.classList.add('active');
}

// تشغيل وإدارة واجهة الفرع المستقلة عند الضغط عليه من القائمة الجانبية
function openSpecificBranchView(branchName) {
    activeBranchContext = branchName;
    const branches = JSON.parse(localStorage.getItem('branches'));
    const currentBranch = branches.find(b => b.name === branchName);

    if(!currentBranch) return;

    // تغيير النصوص في الصفحة المستقلة للفرع
    document.getElementById('selectedBranchTitle').innerText = `🏢 إدارة وتحكم: ${currentBranch.name}`;
    document.getElementById('selectedBranchManagerInfo').innerText = `المدير المسؤول للفرع: ${currentBranch.manager} | راتب المدير: ${currentBranch.salary} $`;
    document.getElementById('addEmpToBranchHeading').innerText = `➕ توظيف عامل جديد في (${currentBranch.name}) مباشرة`;

    // إعطاء الزر في الجانب شكلاً نشطاً وعزل الباقي
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    const targetBtn = document.getElementById(`sidebar-btn-${branchName}`);
    if(targetBtn) targetBtn.classList.add('active');

    // إظهار لوحة الفرع
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active-section'));
    document.getElementById('singleBranchView').classList.add('active-section');

    renderSpecificBranchEmployees();
}

// معالجة وتحديث كافة بيانات وعرض جداول النظام
function renderSystemData() {
    const branches = JSON.parse(localStorage.getItem('branches'));
    const employees = JSON.parse(localStorage.getItem('employees'));
    const users = JSON.parse(localStorage.getItem('users'));
    const logs = JSON.parse(localStorage.getItem('logs')) || [];

    // 1. حساب وعرض الإحصائيات العامة في صفحة "كل شيء"
    document.getElementById('statBranchesCount').innerText = branches.length;
    document.getElementById('statEmployeesCount').innerText = employees.length;
    
    let totalSalariesSum = 0;
    branches.forEach(b => totalSalariesSum += Number(b.salary || 0));
    employees.forEach(e => totalSalariesSum += Number(e.salary || 0));
    document.getElementById('statTotalSalaries').innerText = totalSalariesSum + " $";

    // 2. تحديث قائمة الفروع الجانبية ديناميكياً لتوفير قوائم مستقلة لكل فرع
    const sidebarBranchesList = document.getElementById('sidebarBranchesList');
    sidebarBranchesList.innerHTML = '';
    if(branches.length === 0) {
        sidebarBranchesList.innerHTML = '<div style="font-size:12px; padding:10px 15px; color:#64748b;">لا توجد فروع مضافة حالياً</div>';
    } else {
        branches.forEach(b => {
            sidebarBranchesList.innerHTML += `
                <button class="nav-btn" id="sidebar-btn-${b.name}" onclick="openSpecificBranchView('${b.name}')">
                    🔹 ${b.name}
                </button>
            `;
        });
    }

    // 3. تعبئة جدول الفروع الحالي بصفحة المالك مع ميزة الحذف المضافة حديثاً
    const allBranchesTable = document.getElementById('allBranchesTable');
    allBranchesTable.innerHTML = '';
    branches.forEach((b, index) => {
        allBranchesTable.innerHTML += `
            <tr>
                <td style="font-weight:600;">${b.name}</td>
                <td>${b.manager}</td>
                <td><span style="color:var(--success); font-weight:700;">${b.salary} $</span></td>
                <td>
                    <button class="btn btn-danger" style="padding:5px 12px; font-size:12px;" onclick="deleteBranch(${index})">❌ حذف الفرع</button>
                </td>
            </tr>
        `;
    });

    // 4. تعبئة جدول "قائمة كل شيء" الإجمالي للعمال
    const globalEmployeesTable = document.getElementById('globalEmployeesTable');
    globalEmployeesTable.innerHTML = '';
    employees.forEach((emp, index) => {
        globalEmployeesTable.innerHTML += `
            <tr>
                <td><b>${emp.name}</b></td>
                <td>${emp.phone}</td>
                <td><span style="background:#e0f2fe; color:#0369a1; padding:4px 8px; border-radius:6px; font-size:12px; font-weight:600;">${emp.branch}</span></td>
                <td>${emp.salary} $</td>
                <td><span class="badge ${emp.status === 'نشط' ? 'badge-success' : 'badge-warning'}">${emp.status}</span></td>
                <td>
                    <button class="btn btn-primary" style="padding:4px 10px; font-size:11px;" onclick="openSpecificBranchView('${emp.branch}')">اذهب لإدارة الفرع الخاص به</button>
                </td>
            </tr>
        `;
    });

    // 5. تحديث جدول حسابات النظام والتحكم بحذفها
    const systemUsersTableBody = document.getElementById('systemUsersTableBody');
    systemUsersTableBody.innerHTML = '';
    users.forEach((user, index) => {
        const isProtected = user.username === 'admin' || (currentUser && user.username === currentUser.username);
        
        systemUsersTableBody.innerHTML += `
            <tr>
                <td><b>${user.username}</b></td>
                <td><span style="color: ${user.role === 'owner' ? 'var(--primary)' : 'var(--warning)'}; font-weight:700;">${user.role === 'owner' ? 'مالك (Owner)' : 'محاسب (Accountant)'}</span></td>
                <td>
                    ${isProtected ? 
                        `<span style="color:#a8a29e; font-size:12px; font-style:italic;">🔒 حساب محمي</span>` : 
                        `<button class="btn btn-danger" style="padding:5px 12px; font-size:12px;" onclick="deleteUserAccount(${index})">❌ حذف الحساب</button>`
                    }
                </td>
            </tr>
        `;
    });

    // 6. بناء وتعبئة جدول اللوجات (Logs)
    const logsTableBody = document.getElementById('logsTableBody');
    logsTableBody.innerHTML = '';
    if (logs.length === 0) {
        logsTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#64748b; padding:20px;">لا توجد عمليات مسجلة حالياً في السجل الرقمي.</td></tr>';
    } else {
        logs.forEach(log => {
            let badgeColor = 'var(--primary)';
            if(log.action.includes('حذف') || log.action.includes('فصل')) badgeColor = 'var(--danger)';
            if(log.action.includes('إنشاء') || log.action.includes('توظيف') || log.action.includes('صناعة')) badgeColor = 'var(--success)';
            if(log.action.includes('تعديل') || log.action.includes('تغيير')) badgeColor = 'var(--warning)';

            logsTableBody.innerHTML += `
                <tr>
                    <td style="color:#64748b; font-size:13px; font-family:monospace;">${log.time}</td>
                    <td><b style="color:var(--sidebar-bg);">${log.user}</b></td>
                    <td><span class="badge" style="background-color:${badgeColor};">${log.action}</span></td>
                    <td style="font-weight:600; color:#475569;">${log.details}</td>
                </tr>
            `;
        });
    }
}

// حذف فرع بالكامل مع عماله الموظفين بداخله
function deleteBranch(index) {
    const branches = JSON.parse(localStorage.getItem('branches'));
    const employees = JSON.parse(localStorage.getItem('employees'));
    const branchName = branches[index].name;

    if (confirm(`⚠️ تحذير إداري هام:\nهل أنت متأكد نهائياً من رغبتك في حذف فرع (${branchName})؟\n\nتنبيه: حذف الفرع سيؤدي إلى حذف جميع العمال التابعين له تلقائياً لتفادي أي مشاكل محاسبية!`)) {
        
        branches.splice(index, 1);
        localStorage.setItem('branches', JSON.stringify(branches));

        const remainingEmployees = employees.filter(emp => emp.branch !== branchName);
        localStorage.setItem('employees', JSON.stringify(remainingEmployees));

        addLog('حذف فرع', `تم حذف فرع (${branchName}) بالكامل وتصفية كافة طاقم عماله`);
        alert(`تم حذف فرع (${branchName}) وتصفية كادر عماله بنجاح.`);

        if (activeBranchContext === branchName) {
            activeBranchContext = "";
            switchSection('overview');
        }

        renderSystemData();
    }
}

// حذف حساب موظف/محاسب من النظام (للمالك)
function deleteUserAccount(index) {
    const users = JSON.parse(localStorage.getItem('users'));
    const accountName = users[index].username;

    if (confirm(`⚠️ تحذير إداري:\nهل أنت متأكد نهائياً من رغبتك في حذف الحساب (${accountName}) وإلغاء صلاحياته؟`)) {
        users.splice(index, 1);
        localStorage.setItem('users', JSON.stringify(users));
        
        addLog('حذف حساب', `تم حذف الحساب (${accountName}) وإلغاء صلاحيات دخوله للنظام`);
        alert(`تم حذف حساب الموظف (${accountName}) بنجاح من النظام.`);
        renderSystemData();
    }
}

// عرض العمال وتعديلهم في لوحة فرع مستقلة معينة
function renderSpecificBranchEmployees() {
    const employees = JSON.parse(localStorage.getItem('employees'));
    const branchEmployees = employees.map((emp, idx) => ({...emp, originalIndex: idx})).filter(emp => emp.branch === activeBranchContext);

    const branchSpecificEmployeesTable = document.getElementById('branchSpecificEmployeesTable');
    branchSpecificEmployeesTable.innerHTML = '';

    if(branchEmployees.length === 0) {
        branchSpecificEmployeesTable.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#64748b;">لا يوجد عمال موظفين في هذا الفرع حالياً، قم بتوظيف عمال من الأعلى.</td></tr>';
        return;
    }

    branchEmployees.forEach(emp => {
        branchSpecificEmployeesTable.innerHTML += `
            <tr>
                <td><input type="text" value="${emp.name}" id="sbEditName-${emp.originalIndex}" style="padding:6px 10px;"></td>
                <td><input type="text" value="${emp.phone}" id="sbEditPhone-${emp.originalIndex}" style="padding:6px 10px;"></td>
                <td><input type="number" value="${emp.salary}" id="sbEditSalary-${emp.originalIndex}" style="padding:6px 10px; width:100px;"> $</td>
                <td><span class="badge ${emp.status === 'نشط' ? 'badge-success' : 'badge-warning'}">${emp.status}</span></td>
                <td>
                    <button class="btn btn-primary" style="padding:6px 12px; font-size:12px;" onclick="updateEmployeeData(${emp.originalIndex})">💾 حفظ التعديل</button>
                    <button class="btn btn-warning" style="padding:6px 12px; font-size:12px;" onclick="toggleEmployeeVacation(${emp.originalIndex})">🌴 إجازة/نشط</button>
                    <button class="btn btn-danger" style="padding:6px 12px; font-size:12px;" onclick="fireEmployeeFromBranch(${emp.originalIndex})">❌ فصل</button>
                </td>
            </tr>
        `;
    });
}

// إنشاء فرع جديد (للمالك)
function createNewBranch() {
    const name = document.getElementById('branchName').value.trim();
    const manager = document.getElementById('branchManager').value.trim();
    const salary = document.getElementById('branchManagerSalary').value.trim();

    if(!name || !manager || !salary) return alert('الرجاء تعبئة كافة حقول تأسيس الفرع!');

    const branches = JSON.parse(localStorage.getItem('branches'));
    if(branches.find(b => b.name.toLowerCase() === name.toLowerCase())) return alert('هذا الفرع موجود مسبقاً في النظام!');

    branches.push({ name, manager, salary });
    localStorage.setItem('branches', JSON.stringify(branches));

    addLog('إنشاء فرع', `تأسيس فرع جديد باسم (${name}) وإسناد إدارته للمدير: ${manager}`);
    alert(`تم تأسيس قائمة مستقلة لـ (${name}) بنجاح!`);
    renderSystemData();

    document.getElementById('branchName').value = '';
    document.getElementById('branchManager').value = '';
    document.getElementById('branchManagerSalary').value = '';
}

// إنشاء حساب ورتبة نظام جديدة (للمالك)
function createNewUserAccount() {
    const u = document.getElementById('newUsername').value.trim();
    const p = document.getElementById('newPassword').value.trim();
    const r = document.getElementById('newRole').value;

    if(!u || !p) return alert('يرجى ملء الاسم السري وكلمة المرور للحساب الجديد!');

    const users = JSON.parse(localStorage.getItem('users'));
    if(users.find(user => user.username === u)) return alert('اسم رتبة المستخدم مستعملة سابقاً!');

    users.push({ username: u, password: p, role: r });
    localStorage.setItem('users', JSON.stringify(users));

    addLog('صناعة حساب', `إنشاء مستخدم ورتبة جديدة (${u}) بصلاحية: ${r === 'owner' ? 'مالك' : 'محاسب مالي'}`);
    alert('تم إصدار وتفعيل الحساب والرتبة في النظام!');
    renderSystemData();
    document.getElementById('newUsername').value = '';
    document.getElementById('newPassword').value = '';
}

// توظيف مباشر في الفرع المفتوح حالياً
function addEmployeeToCurrentBranch() {
    const name = document.getElementById('sbEmpName').value.trim();
    const phone = document.getElementById('sbEmpPhone').value.trim();
    const salary = document.getElementById('sbEmpSalary').value.trim();

    if(!name || !phone || !salary) return alert('يرجى تعبئة كامل بيانات العامل المراد توظيفه!');

    const employees = JSON.parse(localStorage.getItem('employees'));
    employees.push({
        name,
        phone,
        salary,
        branch: activeBranchContext,
        status: 'نشط'
    });

    localStorage.setItem('employees', JSON.stringify(employees));
    addLog('توظيف عامل', `تعيين وتوظيف العامل (${name}) براتب ${salary}$ في فرع (${activeBranchContext})`);
    alert(`تم توظيف العامل مباشرة في فرع: ${activeBranchContext}`);
    
    document.getElementById('sbEmpName').value = '';
    document.getElementById('sbEmpPhone').value = '';
    document.getElementById('sbEmpSalary').value = '';

    renderSystemData();
    renderSpecificBranchEmployees();
}

// تحديث بيانات عامل مالي/شخصي (للمحاسب والمالك)
function updateEmployeeData(index) {
    const employees = JSON.parse(localStorage.getItem('employees'));
    const oldName = employees[index].name;
    
    employees[index].name = document.getElementById(`sbEditName-${index}`).value.trim();
    employees[index].phone = document.getElementById(`sbEditPhone-${index}`).value.trim();
    employees[index].salary = document.getElementById(`sbEditSalary-${index}`).value.trim();

    localStorage.setItem('employees', JSON.stringify(employees));
    addLog('تعديل بيانات عامل', `تحديث البيانات الشخصية/المالية للعامل (${oldName}) بفرع (${employees[index].branch})`);
    alert('تم حفظ وتثبيت تعديلات المحاسبة المحدثة!');
    renderSystemData();
    renderSpecificBranchEmployees();
}

// منح إجازة أو تنشيط عامل
function toggleEmployeeVacation(index) {
    const employees = JSON.parse(localStorage.getItem('employees'));
    employees[index].status = employees[index].status === 'نشط' ? 'في إجازة' : 'نشط';
    localStorage.setItem('employees', JSON.stringify(employees));
    
    addLog('تغيير حالة العامل', `تعديل وضعية الموظف (${employees[index].name}) إلى حالة [${employees[index].status}]`);
    renderSystemData();
    renderSpecificBranchEmployees();
}

// فصل عمال من الفرع
function fireEmployeeFromBranch(index) {
    if(confirm("إجراء إداري: هل أنت متأكد نهائياً من قرار فصل هذا العامل؟")) {
        const employees = JSON.parse(localStorage.getItem('employees'));
        const empName = employees[index].name;
        const empBranch = employees[index].branch;
        
        employees.splice(index, 1);
        localStorage.setItem('employees', JSON.stringify(employees));
        
        addLog('فصل عامل', `تم إنهاء خدمات وفصل الموظف (${empName}) من فرع (${empBranch})`);
        renderSystemData();
        renderSpecificBranchEmployees();
    }
}