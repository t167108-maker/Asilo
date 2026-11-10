
"use strict";

// ================================================
// DADOS DEMONSTRATIVOS
// Os residentes abaixo são fictícios.
// ================================================

function localISODate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function futureDate(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return localISODate(date);
}

const demoResidents = [
    { id: 1, name: "Maria Oliveira", code: "RES-001",
      date: "2025-04-10", status: "Ativo", activities: [{time:"08:00",type:"Medicamento",title:"Medicação da manhã",description:"Conforme prescrição registrada pela equipe."},{time:"10:00",type:"Atividade",title:"Caminhada assistida",description:"Atividade leve acompanhada pela equipe."},{time:"14:00",type:"Evento",title:"Oficina de convivência",description:"Atividade recreativa coletiva."}] },
    { id: 2, name: "José Almeida", code: "RES-002",
      date: "2025-06-18", status: "Ativo", activities: [{time:"07:30",type:"Medicamento",title:"Medicação da manhã",description:"Conforme prescrição registrada pela equipe."},{time:"15:00",type:"Atividade",title:"Atividade de memória",description:"Exercícios acompanhados pela equipe."}] },
    { id: 3, name: "Ana Ferreira", code: "RES-003",
      date: "2025-08-02", status: "Em acompanhamento", activities: [{time:"09:00",type:"Atividade",title:"Atendimento de acompanhamento",description:"Horário reservado com a equipe responsável."}] },
    { id: 4, name: "Antônio Santos", code: "RES-004",
      date: "2026-01-15", status: "Ativo", activities: [{time:"08:30",type:"Medicamento",title:"Medicação da manhã",description:"Conforme prescrição registrada pela equipe."},{time:"13:30",type:"Evento",title:"Música e convivência",description:"Atividade coletiva na área de convivência."}] }
];

const demoEvents = [
    {
        id: 1,
        name: "Reunião da equipe",
        date: futureDate(1),
        time: "09:00",
        place: "Sala de reuniões",
        description: "Alinhamento das atividades institucionais."
    },
    {
        id: 2,
        name: "Atividade recreativa",
        date: futureDate(2),
        time: "14:00",
        place: "Área de convivência",
        description: "Atividade coletiva e integração dos residentes."
    },
    {
        id: 3,
        name: "Reunião administrativa",
        date: futureDate(4),
        time: "10:30",
        place: "Setor administrativo",
        description: "Planejamento e acompanhamento de tarefas."
    }
];

const demoNotifications = [
    {
        id: 1,
        title: "Agenda atualizada",
        text: "Há compromissos programados para os próximos dias.",
        date: "Hoje",
        icon: "▦",
        read: false
    },
    {
        id: 2,
        title: "Novo comunicado institucional",
        text: "Consulte os comunicados para acompanhar as informações da equipe.",
        date: "Hoje",
        icon: "▤",
        read: false
    },
    {
        id: 3,
        title: "Revisão cadastral",
        text: "Verifique se os seus dados de contato estão atualizados.",
        date: "Ontem",
        icon: "♙",
        read: false
    }
];

const demoBulletins = [
    {
        id: 1,
        title: "Organização das atividades semanais",
        category: "Institucional",
        audience: "Todos os colaboradores",
        text: "A equipe deve consultar a agenda institucional para verificar os horários e as atividades programadas para a semana.",
        date: "Hoje"
    },
    {
        id: 2,
        title: "Atualização dos dados cadastrais",
        category: "Equipe",
        audience: "Todos os colaboradores",
        text: "Solicitamos que os colaboradores mantenham seus dados de contato atualizados no perfil do sistema.",
        date: "Ontem"
    },
    {
        id: 3,
        title: "Planejamento de atividades",
        category: "Evento",
        audience: "Equipe de assistência",
        text: "As atividades devem ser consultadas previamente na agenda, com atenção aos horários e aos locais indicados.",
        date: "Esta semana"
    }
];

const defaultProfile = {
    name: "Administrador",
    email: "admin@exemplo.com",
    phone: "",
    role: "Administrador",
    department: "Administrativo",
    address: ""
};

// ================================================
// ARMAZENAMENTO LOCAL
// ================================================

function loadData(key, fallback) {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : structuredClone(fallback);
    } catch (error) {
        return structuredClone(fallback);
    }
}

// Sincronização entre abas/janelas do mesmo navegador e mesma origem.
const syncChannel = (typeof BroadcastChannel !== "undefined")
    ? new BroadcastChannel("ajkf-live-sync") : null;

function saveData(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        syncChannel?.postMessage({ key });
    } catch (error) {
        showToast("Não foi possível salvar os dados neste navegador.");
    }
}

let residents = loadData("ajkf_residents", demoResidents);
let events = loadData("ajkf_events", demoEvents);
let notifications = loadData("ajkf_notifications", demoNotifications);
let bulletins = loadData("ajkf_bulletins", demoBulletins);
let profile = loadData("ajkf_profile", defaultProfile);
let currentUser = null;

function nextId(items) {
    return items.reduce(
        (max, item) => Math.max(max, Number(item.id) || 0), 0
    ) + 1;
}

function persistAll() {
    saveData("ajkf_residents", residents);
    saveData("ajkf_events", events);
    saveData("ajkf_notifications", notifications);
    saveData("ajkf_bulletins", bulletins);
    saveData("ajkf_profile", profile);
}

// ================================================
// FUNÇÕES AUXILIARES
// ================================================

function $(id) {
    return document.getElementById(id);
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function initials(name) {
    return String(name || "U")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(part => part.charAt(0))
        .join("")
        .toUpperCase();
}

function formatDate(dateString) {
    if (!dateString) return "—";

    const parts = dateString.split("-").map(Number);

    if (parts.length !== 3 || parts.some(Number.isNaN)) {
        return "—";
    }

    return new Date(parts[0], parts[1] - 1, parts[2])
        .toLocaleDateString("pt-BR");
}

function showToast(message) {
    const toast = $("toast");

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

// ================================================
// NAVEGAÇÃO
// ================================================

const pageNames = {
    inicio: "Página inicial",
    residentes: "Registro de residentes",
    agenda: "Agenda",
    agendamento: "Agendamento",
    notificacoes: "Notificações",
    comunicados: "Comunicados",
    perfil: "Meu perfil",
    contas: "Contas cadastradas"
};

function goToPage(page) {
    if (!pageNames[page]) return;
    if ((page === "agenda" || page === "contas") && !requireAdmin()) return;
    if (page === "agendamento" && currentUser?.role !== "Usuário") { showToast("Agendamento disponível para usuários padrão."); return; }

    document.querySelectorAll(".page").forEach(section => {
        section.classList.toggle(
            "active",
            section.id === `page-${page}`
        );
    });

    document.querySelectorAll(".nav-item[data-page]").forEach(button => {
        button.classList.toggle("active", button.dataset.page === page);
    });

    $("pageTitle").textContent = pageNames[page];
    $("sidebar").classList.remove("open");

    if (page === "inicio") renderDashboard();
    if (page === "residentes") renderResidents();
    if (page === "agenda") { renderEvents(); renderAppointmentRequests(); }
    if (page === "agendamento") renderMyAppointments();
    if (page === "notificacoes") renderNotifications();
    if (page === "comunicados") renderBulletins();
    if (page === "perfil") renderProfile();
    if (page === "contas") renderAccounts();

    window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll("[data-page]").forEach(button => {
    button.addEventListener("click", () => {
        goToPage(button.dataset.page);
    });
});

document.querySelectorAll("[data-go]").forEach(button => {
    button.addEventListener("click", () => {
        goToPage(button.dataset.go);
    });
});

$("menuToggle").addEventListener("click", () => {
    $("sidebar").classList.toggle("open");
});

$("headerNotifications").addEventListener("click", () => {
    goToPage("notificacoes");
});

$("headerProfile").addEventListener("click", () => {
    goToPage("perfil");
});

$("headerProfile").addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        goToPage("perfil");
    }
});

// ================================================
// PAINEL INICIAL
// ================================================

function renderHeaderProfile() {
    $("headerName").textContent = profile.name;
    $("headerRole").textContent = profile.role;
    $("headerAvatar").textContent = initials(profile.name);
}

function renderDashboard() {
    $("residentTotal").textContent = residents.length;
    $("eventTotal").textContent = events.length;
    const dismissedIds = currentUser?.role === "Usuário" ? loadData("ajkf_dismissed_notifications_" + currentUser.email, []) : [];
    const userVisibleNotifications = notifications.filter(item => currentUser?.role === "Administrador" ? true : (!dismissedIds.includes(item.id) && !item.adminOnly && (!item.recipientEmail || item.recipientEmail === currentUser?.email)));
    $("unreadTotal").textContent = userVisibleNotifications.filter(item => !item.read).length;
    $("bulletinTotal").textContent = bulletins.length;

    const unread = userVisibleNotifications.filter(item => !item.read).length;

    $("notificationCount").textContent = unread;
    $("notificationCount").hidden = unread === 0;
    $("headerDot").hidden = unread === 0;

    $("welcomeTitle").textContent =
        `Bem-vindo(a), ${(profile.name || "Usuário").split(" ")[0]}!`;

    const recentNotifications = userVisibleNotifications.map(item => ({
        icon: item.icon || "♧",
        title: item.title,
        text: item.text,
        date: item.date
    }));

    const recentEvents = [...events]
        .sort((a, b) =>
            (a.date + a.time).localeCompare(b.date + b.time)
        )
        .slice(0, 2)
        .map(item => ({
            icon: "▦",
            title: item.name,
            text: `${formatDate(item.date)} às ${item.time}`,
            date: item.place || "Agenda institucional"
        }));

    const activities = [
        ...recentNotifications,
        ...recentEvents
    ].slice(0, 4);

    $("recentActivities").innerHTML = activities.length
        ? activities.map(item => `
            <div class="activity-item">
                <div class="activity-icon">${escapeHTML(item.icon)}</div>
                <div>
                    <strong>${escapeHTML(item.title)}</strong>
                    <p>${escapeHTML(item.text)}</p>
                    <time>${escapeHTML(item.date)}</time>
                </div>
            </div>
        `).join("")
        : '<div class="empty-state">Nenhuma atividade recente.</div>';
}

// ================================================
// REGISTRO DE RESIDENTES
// ================================================

function renderResidents() {
    if (currentUser?.role !== "Administrador") return;
    const search = $("residentSearch").value
        .trim().toLocaleLowerCase("pt-BR");

    const filter = $("residentFilter").value;

    const filtered = residents.filter(resident => {
        const name = resident.name.toLocaleLowerCase("pt-BR");
        const code = resident.code.toLocaleLowerCase("pt-BR");

        const matchesSearch =
            name.includes(search) || code.includes(search);

        const matchesFilter =
            !filter || resident.status === filter;

        return matchesSearch && matchesFilter;
    });

    $("residentTable").innerHTML = filtered.map(resident => `
        <tr>
            <td>
                <div class="person-cell">
                    <div class="mini-avatar">
                        ${escapeHTML(initials(resident.name))}
                    </div>
                    <div>
                        <strong>${escapeHTML(resident.name)}</strong>
                        <small>Cadastro institucional</small>
                    </div>
                </div>
            </td>
            <td>${escapeHTML(resident.code)}</td>
            <td>${formatDate(resident.date)}</td>
            <td>
                <span class="status ${
                    resident.status === "Ativo"
                        ? "status-green"
                        : "status-yellow"
                }">${escapeHTML(resident.status)}</span>
            </td>
            <td>
                <button class="btn btn-secondary" data-edit-resident="${resident.id}" data-admin-only>Editar</button>
                <button class="btn btn-secondary" data-manage-activities="${resident.id}" data-admin-only>Atividades</button>
            </td>
        </tr>
    `).join("");

    $("residentEmpty").hidden = filtered.length > 0;
}

$("residentSearch").addEventListener("input", renderResidents);
$("residentFilter").addEventListener("change", renderResidents);

document.querySelectorAll("[data-resident-tab]").forEach(button => button.addEventListener("click", () => {
    const tab = button.dataset.residentTab;
    document.querySelectorAll("[data-resident-tab]").forEach(item => item.classList.toggle("active", item === button));
    $("residentBasicFields").hidden = tab !== "basic";
    $("residentPersonalFields").hidden = tab !== "personal";
}));

$("newResident").addEventListener("click", () => {
    if (!requireAdmin()) return;
    $("residentForm").reset();
    document.querySelector('[data-resident-tab="basic"]').click();
    $("residentEditId").value = "";
    $("residentModalTitle").textContent = "Cadastrar residente";
    $("newResidentDate").value = localISODate(new Date());
    ["residentCPF","residentRG","residentAge","residentSex","residentBirthplace"].forEach(id => $(id).value = "");

    openModal("residentModal");
    $("newResidentName").focus();
});

$("residentTable").addEventListener("click", event => {
    const activityButton = event.target.closest("[data-manage-activities]");
    if (activityButton) { openResidentActivities(activityButton.dataset.manageActivities); return; }
    const button = event.target.closest("[data-edit-resident]");
    if (!button) return;
    if (!requireAdmin()) return;
    const resident = residents.find(item => item.id === Number(button.dataset.editResident));

    if (!resident) return;

    document.querySelector('[data-resident-tab="basic"]').click();
    $("residentEditId").value = resident.id;
    $("newResidentName").value = resident.name;
    $("newResidentDate").value = resident.date;
    $("newResidentStatus").value = resident.status;
    const personal = resident.personalInfo || {};
    $("residentCPF").value = personal.cpf || "";
    $("residentRG").value = personal.rg || "";
    $("residentAge").value = personal.age ?? "";
    $("residentSex").value = personal.sex || "";
    $("residentBirthplace").value = personal.birthplace || "";
    $("residentModalTitle").textContent = "Editar residente";

    openModal("residentModal");
});

$("residentForm").addEventListener("submit", event => {
    event.preventDefault();
    if (!requireAdmin()) return;

    const editId = Number($("residentEditId").value);
    const name = $("newResidentName").value.trim();
    const date = $("newResidentDate").value;
    const status = $("newResidentStatus").value;

    if (!name || !date) return;

    if (editId) {
        const resident = residents.find(item => item.id === editId);

        if (resident) {
            resident.name = name;
            resident.date = date;
            resident.status = status;
            resident.personalInfo = {
                cpf: $("residentCPF").value.trim(), rg: $("residentRG").value.trim(),
                age: $("residentAge").value ? Number($("residentAge").value) : "",
                sex: $("residentSex").value, birthplace: $("residentBirthplace").value.trim()
            };
        }
    } else {
        const id = nextId(residents);

        residents.push({
            id,
            name,
            code: "RES-" + String(id).padStart(3, "0"),
            date,
            status,
            activities: [],
            personalInfo: {
                cpf: $("residentCPF").value.trim(), rg: $("residentRG").value.trim(),
                age: $("residentAge").value ? Number($("residentAge").value) : "",
                sex: $("residentSex").value, birthplace: $("residentBirthplace").value.trim()
            }
        });
    }

    saveData("ajkf_residents", residents);

    renderResidents();
    renderDashboard();
    closeModal("residentModal");

    showToast("Registro atualizado com sucesso.");
});

// ================================================
// AGENDA
// ================================================

function renderEvents() {
    const sorted = [...events].sort((a, b) =>
        (a.date + a.time).localeCompare(b.date + b.time)
    );

    $("eventList").innerHTML = sorted.length
        ? sorted.map(item => {
            const date = item.date.split("-");
            const day = date[2] || "—";

            const month = date.length === 3
                ? new Date(
                    Number(date[0]),
                    Number(date[1]) - 1,
                    1
                ).toLocaleDateString("pt-BR", { month: "short" })
                : "";

            return `
                <div class="event">
                    <div class="event-date">
                        <strong>${escapeHTML(day)}</strong>
                        <span>${escapeHTML(month)}</span>
                    </div>
                    <div class="event-details">
                        <strong>${escapeHTML(item.name)}</strong>
                        <p>
                            ${escapeHTML(item.description || "Sem descrição")}
                            <br>📍 ${escapeHTML(item.place || "Local não informado")}
                        </p>
                        <div class="event-time">
                            ◷ ${escapeHTML(item.time)}
                        </div>
                    </div>
                </div>
            `;
        }).join("")
        : '<div class="empty-state">Nenhum compromisso cadastrado.</div>';
}

$("newEvent").addEventListener("click", () => {
    if (!requireAdmin()) return;
    $("eventDate").value = futureDate(1);
    $("eventTime").value = "09:00";
    $("eventName").focus();
});

$("eventForm").addEventListener("submit", event => {
    event.preventDefault();
    if (!requireAdmin()) return;

    const name = $("eventName").value.trim();
    const date = $("eventDate").value;
    const time = $("eventTime").value;

    if (!name || !date || !time) return;

    events.push({
        id: nextId(events),
        name,
        date,
        time,
        place: $("eventPlace").value.trim(),
        description: $("eventDescription").value.trim()
    });

    saveData("ajkf_events", events);

    event.target.reset();
    renderEvents();
    renderDashboard();

    showToast("Compromisso adicionado à agenda.");
});

// ================================================
// NOTIFICAÇÕES
// ================================================

function renderNotifications() {
    const filter = $("notificationFilter").value;

    const dismissedIds = currentUser?.role === "Usuário" ? loadData("ajkf_dismissed_notifications_" + currentUser.email, []) : [];
    const visibleNotifications = notifications.filter(item => currentUser?.role === "Administrador" ? true : (!dismissedIds.includes(item.id) && !item.adminOnly && (!item.recipientEmail || item.recipientEmail === currentUser?.email)));
    const filtered = visibleNotifications.filter(item => {
        if (filter === "unread") return !item.read;
        if (filter === "read") return item.read;
        return true;
    });

    const unread = visibleNotifications.filter(item => !item.read).length;

    $("notificationSubtitle").textContent =
        `${unread} notificação(ões) não lida(s).`;

    $("notificationList").innerHTML = filtered.length
        ? filtered.map(item => `
            <div class="notice ${item.read ? "" : "unread"}">
                <div class="notice-icon">
                    ${escapeHTML(item.icon || "♧")}
                </div>
                <div class="notice-body">
                    <h3>
                        ${escapeHTML(item.title)}
                        ${item.read ? "" :
                            '<span class="status status-green">Nova</span>'}
                    </h3>
                    <p>${escapeHTML(item.text)}</p>
                    <time>${escapeHTML(item.date)}</time>
                </div>
                <div class="notice-actions">
                    ${item.read ? "" : (currentUser?.role === "Administrador" ? `
                        <button class="btn btn-secondary" data-read-notification="${item.id}">Marcar como lida</button>` : "")}
                    ${currentUser?.role === "Usuário" ? `<button class="notification-delete" type="button" data-delete-notification="${item.id}" aria-label="Excluir notificação" title="Excluir">×</button>` : ""}
                </div>
            </div>
        `).join("")
        : '<div class="empty-state">Nenhuma notificação nesta categoria.</div>';

    renderDashboard();
}

$("notificationFilter").addEventListener("change", renderNotifications);

$("notificationList").addEventListener("click", event => {
    const deleteButton = event.target.closest("[data-delete-notification]");
    if (deleteButton) {
        if (currentUser?.role !== "Usuário") return;
        const id = Number(deleteButton.dataset.deleteNotification);
        const key = "ajkf_dismissed_notifications_" + currentUser.email;
        const dismissed = loadData(key, []);
        if (!dismissed.includes(id)) dismissed.push(id);
        saveData(key, dismissed); renderNotifications(); showToast("Notificação excluída."); return;
    }
    const button = event.target.closest("[data-read-notification]");
    if (!button) return;
    if (!requireAdmin()) return;
    const item = notifications.find(notification => notification.id === Number(button.dataset.readNotification));

    if (!item) return;

    item.read = true;

    saveData("ajkf_notifications", notifications);
    renderNotifications();

    showToast("Notificação marcada como lida.");
});

$("markAllRead").addEventListener("click", () => {
    if (!requireAdmin()) return;
    notifications.forEach(item => {
        item.read = true;
    });

    saveData("ajkf_notifications", notifications);
    renderNotifications();

    showToast("Todas as notificações foram marcadas como lidas.");
});

$("clearAllNotifications").addEventListener("click", () => {
    if (currentUser?.role !== "Usuário") return;
    const key = "ajkf_dismissed_notifications_" + currentUser.email;
    const dismissed = loadData(key, []);
    notifications.filter(item => !item.adminOnly && (!item.recipientEmail || item.recipientEmail === currentUser.email)).forEach(item => { if (!dismissed.includes(item.id)) dismissed.push(item.id); });
    saveData(key, dismissed); renderNotifications(); showToast("Todas as suas notificações foram removidas.");
});

// ================================================
// COMUNICADOS
// ================================================

function renderBulletins() {
    $("bulletinGrid").innerHTML = bulletins.length
        ? bulletins.map(item => `
            <article class="bulletin">
                <div class="bulletin-top">
                    <span class="status status-green">
                        ${escapeHTML(item.category)}
                    </span>
                    <time>${escapeHTML(item.date)}</time>
                </div>
                <h3>${escapeHTML(item.title)}</h3>
                <p>${escapeHTML(item.text)}</p>
                <div class="bulletin-footer">
                    <span>👥 ${escapeHTML(item.audience || "Equipe")}</span>
                    <span>Asilo João Kuhl Filho</span>
                    ${currentUser?.role === "Administrador" ? `<button class="btn btn-danger" type="button" data-delete-bulletin="${item.id}">Remover</button>` : ""}
                </div>
            </article>
        `).join("")
        : '<div class="empty-state">Nenhum comunicado publicado.</div>';
}

$("newBulletin").addEventListener("click", () => {
    if (!requireAdmin()) return;
    $("bulletinForm").reset();
    openModal("bulletinModal");
    $("bulletinTitle").focus();
});

$("bulletinForm").addEventListener("submit", event => {
    event.preventDefault();
    if (!requireAdmin()) return;

    const title = $("bulletinTitle").value.trim();
    const text = $("bulletinContent").value.trim();

    if (!title || !text) return;

    bulletins.unshift({
        id: nextId(bulletins),
        title,
        category: $("bulletinCategory").value,
        audience: $("bulletinAudience").value,
        text,
        date: new Date().toLocaleDateString("pt-BR")
    });

    saveData("ajkf_bulletins", bulletins);

    renderBulletins();
    renderDashboard();
    closeModal("bulletinModal");

    event.target.reset();

    showToast("Comunicado publicado com sucesso.");
});

$("bulletinGrid").addEventListener("click", event => {
    const button = event.target.closest("[data-delete-bulletin]");
    if (!button || !requireAdmin()) return;
    const id = Number(button.dataset.deleteBulletin);
    const bulletin = bulletins.find(item => item.id === id);
    if (!bulletin || !confirm(`Remover o comunicado "${bulletin.title}"?`)) return;
    bulletins = bulletins.filter(item => item.id !== id);
    saveData("ajkf_bulletins", bulletins); renderBulletins(); renderDashboard(); showToast("Comunicado removido.");
});

// ================================================
// PERFIL DO USUÁRIO
// ================================================

function renderProfile() {
    $("profileName").value = profile.name;
    $("profileEmail").value = profile.email;
    $("profilePhone").value = profile.phone || "";
    $("profileRole").value = profile.role;
    $("profileDepartment").value = profile.department;
    $("profileRole").readOnly = true;
    $("profileDepartment").disabled = true;
    $("profileAddress").value = profile.address || "";

    $("profileDisplayName").textContent = profile.name;
    $("profileDisplayEmail").textContent = profile.email;
    $("profileDisplayPhone").textContent =
        profile.phone || "Não informado";
    $("profileDisplayRole").textContent = profile.role;
    $("profileAvatar").textContent = initials(profile.name);

    renderHeaderProfile();
}

$("profileForm").addEventListener("submit", event => {
    event.preventDefault();
    const name = $("profileName").value.trim();
    const email = $("profileEmail").value.trim().toLowerCase();
    const phone = $("profilePhone").value.trim();
    if (!name || !email) { showToast("Nome e e-mail são obrigatórios."); return; }
    if (currentUser?.role === "Usuário") {
        const users = getRegisteredUsers();
        if (users.some(item => item.email.toLowerCase() === email && item.email.toLowerCase() !== currentUser.email.toLowerCase())) { showToast("Este e-mail já está sendo utilizado."); return; }
        const account = users.find(item => item.email.toLowerCase() === currentUser.email.toLowerCase());
        if (!account) { showToast("Conta não encontrada. Faça login novamente."); return; }
        account.name = name; account.email = email; account.phone = phone;
        saveData(USERS_KEY, users);
        currentUser.name = name; currentUser.email = email; currentUser.phone = phone;
    } else { currentUser.name = name; currentUser.email = email; currentUser.phone = phone; }
    profile = { name, email, phone, role: currentUser?.role || "Usuário", department: profile.department || (currentUser?.role === "Administrador" ? "Administrativo" : "Equipe"), address: $("profileAddress").value.trim() };
    saveData("ajkf_profile_" + currentUser.email, profile);

    renderProfile();
    renderDashboard();

    showToast("Dados cadastrais atualizados com sucesso.");
});

$("resetProfile").addEventListener("click", () => {
    renderProfile();
    showToast("Alterações não salvas foram descartadas.");
});

// ================================================
// MODAIS
// ================================================

function openModal(id) {
    $(id).classList.add("open");
}

function closeModal(id) {
    $(id).classList.remove("open");
}

document.querySelectorAll("[data-close]").forEach(button => {
    button.addEventListener("click", () => {
        closeModal(button.dataset.close);
    });
});

document.querySelectorAll(".modal").forEach(modal => {
    modal.addEventListener("click", event => {
        if (event.target === modal) {
            closeModal(modal.id);
        }
    });
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        document.querySelectorAll(".modal.open").forEach(modal => {
            closeModal(modal.id);
        });

        $("sidebar").classList.remove("open");
    }
});

// CONSULTA DE RESIDENTES (USUÁRIO) E CONTAS (ADM)
function renderResidentLookup(resident) {
 const target = $("residentLookupResult");
 if (!resident) { target.innerHTML = '<div class="empty-state">Nenhum residente encontrado com esse código exato.</div>'; return; }
 const items = Array.isArray(resident.activities) ? resident.activities.slice().sort((a,b)=>String(a.time).localeCompare(String(b.time))) : [];
 const personal = resident.personalInfo || {};
 target.innerHTML = `<div class="resident-profile-card"><div class="resident-profile-heading"><div><span class="eyebrow">PERFIL DO RESIDENTE</span><h3>${escapeHTML(resident.name)}</h3><p>Código: <strong>${escapeHTML(resident.code)}</strong></p></div><span class="status ${resident.status === "Ativo" ? "status-green" : "status-yellow"}">${escapeHTML(resident.status)}</span></div><section class="resident-personal-readonly"><h4>Informações pessoais</h4><div class="resident-personal-grid"><div><small>CPF</small><strong>${escapeHTML(personal.cpf || "Não informado")}</strong></div><div><small>RG</small><strong>${escapeHTML(personal.rg || "Não informado")}</strong></div><div><small>Idade</small><strong>${personal.age !== undefined && personal.age !== "" ? `${escapeHTML(personal.age)} anos` : "Não informado"}</strong></div><div><small>Sexo</small><strong>${escapeHTML(personal.sex || "Não informado")}</strong></div><div class="full"><small>Local de nascimento</small><strong>${escapeHTML(personal.birthplace || "Não informado")}</strong></div></div><p class="form-hint">Informações pessoais disponíveis apenas para consulta. Somente ADM pode alterá-las.</p></section><div class="resident-day"><h4>Atividades do dia — ${formatDate(localISODate(new Date()))}</h4>${items.length ? items.map(item=>`<div class="resident-day-item"><time>${escapeHTML(item.time || "—")}</time><div><small>${escapeHTML(item.type || "Atividade")}</small><strong>${escapeHTML(item.title || "Atividade")}</strong><p>${escapeHTML(item.description || "")}</p></div></div>`).join("") : '<p class="form-hint">Não há atividades cadastradas para este residente.</p>'}</div></div>`;
}
$("residentLookupForm").addEventListener("submit", event => { event.preventDefault(); const code = $("residentLookupCode").value.trim().toUpperCase(); renderResidentLookup(residents.find(item => String(item.code).toUpperCase() === code)); });
// ================================================
// ATIVIDADES DIÁRIAS DOS RESIDENTES (SOMENTE ADM)
// ================================================
function activityEditorRow(activity, index) {
    return `<div class="activity-edit-row">
        <input aria-label="Horário" type="time" data-activity-field="time" data-index="${index}" value="${escapeHTML(activity.time || "")}">
        <input aria-label="Tipo" data-activity-field="type" data-index="${index}" value="${escapeHTML(activity.type || "")}">
        <input aria-label="Atividade" data-activity-field="title" data-index="${index}" value="${escapeHTML(activity.title || "")}">
        <input aria-label="Descrição" data-activity-field="description" data-index="${index}" value="${escapeHTML(activity.description || "")}">
        <button class="btn btn-danger" type="button" data-remove-activity="${index}">Remover</button>
    </div>`;
}

function openResidentActivities(id) {
    if (!requireAdmin()) return;
    const resident = residents.find(item => item.id === Number(id));
    if (!resident) return;
    resident.activities = Array.isArray(resident.activities) ? resident.activities : [];
    const target = $("residentActivitiesPanel");
    target.innerHTML = `<div class="card activity-editor">
        <div class="section-header"><div><div class="card-title">Atividades de ${escapeHTML(resident.name)}</div><div class="card-subtitle">Código ${escapeHTML(resident.code)} · alterações disponíveis somente para ADM.</div></div><button class="btn btn-secondary" type="button" id="closeActivityEditor">Fechar</button></div>
        <div id="residentActivityRows">${resident.activities.map(activityEditorRow).join("") || '<p class="form-hint">Nenhuma atividade cadastrada.</p>'}</div>
        <form id="addResidentActivityForm"><div class="form-grid">
            <div class="form-group"><label for="activityTime">Horário</label><input id="activityTime" name="time" type="time" required></div>
            <div class="form-group"><label for="activityType">Tipo</label><select id="activityType" name="type"><option>Medicamento</option><option>Atividade</option><option>Evento</option><option>Atendimento</option></select></div>
            <div class="form-group full"><label for="activityTitle">Nome da atividade</label><input id="activityTitle" name="title" maxlength="120" required></div>
            <div class="form-group full"><label for="activityDescription">Descrição</label><textarea id="activityDescription" name="description" maxlength="500"></textarea></div>
        </div><div class="form-footer"><button class="btn btn-primary" type="submit">Adicionar atividade</button></div></form>
    </div>`;
    target.hidden = false;
    $("closeActivityEditor").addEventListener("click", () => { target.hidden = true; });
    $("residentActivityRows").addEventListener("click", event => {
        const button = event.target.closest("[data-remove-activity]");
        if (!button || !requireAdmin()) return;
        resident.activities.splice(Number(button.dataset.removeActivity), 1);
        saveData("ajkf_residents", residents);
        openResidentActivities(resident.id);
        renderResidents();
        showToast("Atividade removida.");
    });
    $("residentActivityRows").addEventListener("change", event => {
        const input = event.target.closest("[data-activity-field]");
        if (!input || !requireAdmin()) return;
        const activity = resident.activities[Number(input.dataset.index)];
        if (!activity) return;
        activity[input.dataset.activityField] = input.value;
        saveData("ajkf_residents", residents);
    });
    $("addResidentActivityForm").addEventListener("submit", event => {
        event.preventDefault();
        if (!requireAdmin()) return;
        const formData = new FormData(event.currentTarget);
        resident.activities.push({ time: formData.get("time"), type: formData.get("type"), title: String(formData.get("title")).trim(), description: String(formData.get("description") || "").trim() });
        saveData("ajkf_residents", residents);
        openResidentActivities(resident.id);
        renderResidents();
        showToast("Atividade adicionada.");
    });
}

// ================================================
// AGENDAMENTOS DE VISITAS E REUNIÕES
// ================================================
const APPOINTMENTS_KEY = "ajkf_appointment_requests";
let appointments = loadData(APPOINTMENTS_KEY, []);
function saveAppointments() { saveData(APPOINTMENTS_KEY, appointments); }

function renderAppointmentRequests() {
    if (!requireAdmin()) return;
    const pending = appointments.filter(item => item.status === "Pendente");
    $("appointmentRequests").innerHTML = pending.length ? pending.map(item => `
        <div class="request-item"><div><strong>${escapeHTML(item.typeLabel)} · ${escapeHTML(item.subject)}</strong><p>${escapeHTML(item.userName)} (${escapeHTML(item.userEmail)}) · ${formatDate(item.date)} às ${escapeHTML(item.time)}</p><small>${escapeHTML(item.note || "")}</small></div>
        <div class="request-actions"><button class="btn btn-primary" type="button" data-appointment-accept="${item.id}">Aceitar</button><button class="btn btn-danger" type="button" data-appointment-deny="${item.id}">Negar</button></div></div>
    `).join("") : '<div class="empty-state">Nenhuma solicitação pendente.</div>';
}

$("appointmentRequests").addEventListener("click", event => {
    const acceptButton = event.target.closest("[data-appointment-accept]");
    const denyButton = event.target.closest("[data-appointment-deny]");
    if (!acceptButton && !denyButton) return;
    if (!requireAdmin()) return;
    const id = Number(acceptButton ? acceptButton.dataset.appointmentAccept : denyButton.dataset.appointmentDeny);
    const item = appointments.find(request => request.id === id);
    if (!item || item.status !== "Pendente") return;
    const accepted = Boolean(acceptButton);
    item.status = accepted ? "Aprovado" : "Recusado";
    item.reviewedAt = new Date().toISOString();
    saveAppointments();
    notifications.unshift({ id: nextId(notifications), title: accepted ? "Agendamento aprovado" : "Agendamento recusado", text: accepted ? `Seu ${item.typeLabel.toLowerCase()} foi aprovado para ${formatDate(item.date)} às ${item.time}.` : `Sua solicitação de ${item.typeLabel.toLowerCase()} para ${formatDate(item.date)} às ${item.time} foi recusada.`, date: new Date().toLocaleDateString("pt-BR"), icon: "▣", read: false, recipientEmail: item.userEmail });
    saveData("ajkf_notifications", notifications);
    renderAppointmentRequests();
    renderNotifications();
    showToast(accepted ? "Agendamento aprovado." : "Solicitação recusada.");
});

$("appointmentDate").min = localISODate(new Date());
$("appointmentType").addEventListener("change", () => {
    const isVisit = $("appointmentType").value === "visita";
    $("appointmentResidentGroup").hidden = !isVisit;
    $("appointmentRoleGroup").hidden = isVisit;
    $("appointmentResidentCode").required = isVisit;
    $("appointmentStaffRole").required = !isVisit;
});
$("appointmentType").dispatchEvent(new Event("change"));

$("appointmentForm").addEventListener("submit", event => {
    event.preventDefault();
    if (currentUser?.role !== "Usuário") return;
    const type = $("appointmentType").value;
    const date = $("appointmentDate").value;
    const time = $("appointmentTime").value;
    if (!date || !time || date < localISODate(new Date())) { showToast("Escolha uma data válida, a partir de hoje."); return; }
    let subject;
    if (type === "visita") {
        const code = $("appointmentResidentCode").value.trim().toUpperCase();
        const resident = residents.find(item => String(item.code).toUpperCase() === code);
        if (!resident) { showToast("Código de residente não encontrado. Confira o código exato."); return; }
        subject = `${resident.name} (${resident.code})`;
    } else subject = $("appointmentStaffRole").value;
    const request = { id: nextId(appointments), type, typeLabel: type === "visita" ? "Visita" : "Reunião", subject, date, time, note: $("appointmentNote").value.trim(), userEmail: currentUser.email, userName: currentUser.name, status: "Pendente", createdAt: new Date().toISOString() };
    appointments.push(request);
    saveAppointments();
    notifications.unshift({ id: nextId(notifications), title: "Nova solicitação de agendamento", text: `${request.userName} solicitou ${request.typeLabel.toLowerCase()}: ${request.subject}, em ${formatDate(date)} às ${time}.`, date: new Date().toLocaleDateString("pt-BR"), icon: "▣", read: false, recipientEmail: null, adminOnly: true });
    saveData("ajkf_notifications", notifications);
    event.currentTarget.reset();
    $("appointmentType").dispatchEvent(new Event("change"));
    renderMyAppointments();
    showToast("Solicitação enviada para aprovação do administrador.");
});

function renderMyAppointments() {
    if (currentUser?.role !== "Usuário") return;
    const mine = appointments.filter(item => item.userEmail === currentUser.email).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    $("myAppointments").innerHTML = mine.length ? mine.map(item => `
        <div class="request-item"><div><strong>${escapeHTML(item.typeLabel)} · ${escapeHTML(item.subject)}</strong><p>${formatDate(item.date)} às ${escapeHTML(item.time)}</p><small>${escapeHTML(item.note || "")}</small></div><span class="status ${item.status === "Aprovado" ? "status-green" : item.status === "Recusado" ? "status-yellow" : ""}">${escapeHTML(item.status)}</span></div>
    `).join("") : '<div class="empty-state">Você ainda não possui agendamentos.</div>';
}

function renderAccounts() { if (!requireAdmin()) return; const users=getRegisteredUsers(); $("accountsTable").innerHTML=users.map(user=>`<tr><td><strong>${escapeHTML(user.name)}</strong></td><td>${escapeHTML(user.email)}</td><td>${escapeHTML(user.phone || "—")}</td><td>${user.createdAt ? formatDate(user.createdAt.slice(0,10)) : "—"}</td><td><button class="btn btn-danger" type="button" data-ban-user="${escapeHTML(user.email)}">Banir</button></td></tr>`).join(""); $("accountsEmpty").hidden=users.length>0; }
$("accountsTable").addEventListener("click", event=>{ const button=event.target.closest("[data-ban-user]"); if(!button || !requireAdmin()) return; const email=button.dataset.banUser; const user=getRegisteredUsers().find(item=>item.email===email); if(!user || !confirm(`Deseja banir ${user.name}? O login será excluído deste dispositivo.`)) return; saveData(USERS_KEY,getRegisteredUsers().filter(item=>item.email!==email)); localStorage.removeItem("ajkf_profile_"+email); renderAccounts(); showToast("Conta banida e login removido."); });

// ================================================
// INICIALIZAÇÃO DO SISTEMA
// ================================================

$("currentDate").textContent = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
});

renderProfile();
renderEvents();
renderNotifications();
renderBulletins();
renderDashboard();

// ================================================
// AUTENTICAÇÃO E CONTROLE DE ACESSO (MODO LOCAL)
// ================================================
// Altere estas credenciais antes de distribuir o protótipo.
// Em produção, credenciais e permissões devem ficar no servidor.
const ADMIN_CREDENTIALS = {
    email: "adm@email.com",
    password: "123adm",
    name: "Administrador"
};

const USERS_KEY = "ajkf_registered_users";

// Alterna a visibilidade das senhas nos formulários de autenticação.
document.querySelectorAll("[data-toggle-password]").forEach(button => {
    button.addEventListener("click", () => {
        const input = document.getElementById(button.dataset.togglePassword);
        if (!input) return;
        const showing = input.type === "password";
        input.type = showing ? "text" : "password";
        button.setAttribute("aria-pressed", String(showing));
        button.setAttribute("aria-label", showing ? "Ocultar senha" : "Mostrar senha");
        button.title = showing ? "Ocultar senha" : "Mostrar senha";
        button.textContent = showing ? "🙈" : "👁";
    });
});

function getRegisteredUsers() {
    return loadData(USERS_KEY, []);
}

function setAuthMessage(message, success = false) {
    const el = $("authMessage");
    el.textContent = message;
    el.classList.toggle("success", success);
}

function showAuthTab(tab) {
    const forms = { login: "loginForm", signup: "signupForm" };
    document.querySelectorAll("[data-auth-tab]").forEach(button => {
        button.classList.toggle("active", button.dataset.authTab === tab);
    });
    Object.entries(forms).forEach(([name, id]) => { $(id).hidden = name !== tab; });
    setAuthMessage("");
}

document.querySelectorAll("[data-auth-tab]").forEach(button => {
    button.addEventListener("click", () => showAuthTab(button.dataset.authTab));
});

// Derivação de hash com salt: evita guardar a senha em texto puro neste protótipo.
async function hashPassword(password, saltHex) {
    const encoder = new TextEncoder();
    const salt = saltHex
        ? Uint8Array.from(saltHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)))
        : crypto.getRandomValues(new Uint8Array(16));
    const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 120000, hash: "SHA-256" }, key, 256);
    const hash = Array.from(new Uint8Array(bits), byte => byte.toString(16).padStart(2, "0")).join("");
    const saltResult = Array.from(salt, byte => byte.toString(16).padStart(2, "0")).join("");
    return { salt: saltResult, hash };
}

function requireAdmin() {
    if (currentUser?.role === "Administrador") return true;
    showToast("Ação permitida somente para administradores.");
    return false;
}

const SESSION_KEY = "ajkf_active_session";

function enterApplication(user, persistSession = true) {
    currentUser = user;
    if (persistSession) {
        try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({
            email: user.email, name: user.name, phone: user.phone || "", role: user.role
        })); } catch (_) { /* sessão continua ativa apenas nesta página */ }
    }
    document.body.classList.add("authenticated");
    document.body.classList.toggle("role-user", user.role !== "Administrador");
    document.body.classList.toggle("role-admin", user.role === "Administrador");
    $("authScreen").hidden = true;
    $("residentsNavLabel").textContent = user.role === "Administrador" ? "Registro de residentes" : "Consultar residente";
    document.querySelectorAll("[data-user-only]").forEach(el => { el.hidden = user.role !== "Usuário"; });
    $("adminResidentsView").hidden = user.role !== "Administrador";
    $("userResidentLookup").hidden = user.role === "Administrador";

    profile = {
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        role: user.role,
        department: user.role === "Administrador" ? "Administrativo" : "Equipe",
        address: ""
    };
    if (user.role === "Usuário") { const saved = loadData("ajkf_profile_" + user.email, null); if (saved) profile = saved; }
    renderProfile();
    if (user.role === "Administrador") { renderResidents(); renderAppointmentRequests(); }
    renderEvents();
    renderNotifications();
    renderBulletins();
    renderDashboard();
    goToPage("inicio");
}

$("loginForm").addEventListener("submit", async event => {
    event.preventDefault();
    const email = $("loginEmail").value.trim().toLowerCase();
    const password = $("loginPassword").value;
    if (email === ADMIN_CREDENTIALS.email.toLowerCase() && password === ADMIN_CREDENTIALS.password) {
        enterApplication({ name: ADMIN_CREDENTIALS.name, email: ADMIN_CREDENTIALS.email, phone: "", role: "Administrador" });
        $("loginForm").reset(); return;
    }
    const user = getRegisteredUsers().find(item => item.email === email);
    if (!user) {
        setAuthMessage("E-mail não cadastrado. Selecione Sign in para criar uma conta.");
        return;
    }
    try {
        const result = await hashPassword(password, user.salt);
        if (result.hash !== user.passwordHash) {
            setAuthMessage("E-mail ou senha inválidos.");
            return;
        }
        enterApplication({ name: user.name, email: user.email, phone: user.phone, role: "Usuário" });
        $("loginForm").reset();
    } catch (error) {
        setAuthMessage("Não foi possível validar a conta neste dispositivo.");
    }
});

$("signupForm").addEventListener("submit", async event => {
    event.preventDefault();
    const email = $("signupEmail").value.trim().toLowerCase();
    const password = $("signupPassword").value;
    const confirm = $("signupConfirm").value;
    const name = $("signupName").value.trim();
    const phone = $("signupPhone").value.trim();
    if (!email || !password || !confirm || !name || !phone) {
        setAuthMessage("Preencha todos os campos para criar o login."); return;
    }
    if (password !== confirm) {
        setAuthMessage("Senha e confirmação devem ser exatamente iguais."); return;
    }
    if (password.length < 6) {
        setAuthMessage("A senha deve ter pelo menos 6 caracteres."); return;
    }
    if (email === ADMIN_CREDENTIALS.email.toLowerCase()) {
        setAuthMessage("Este e-mail é reservado à administração."); return;
    }
    const users = getRegisteredUsers();
    if (users.some(item => item.email.toLowerCase() === email)) {
        setAuthMessage("Este e-mail já possui cadastro. Utilize outro e-mail."); return;
    }
    try {
        const credentials = await hashPassword(password);
        users.push({ email, name, phone, salt: credentials.salt, passwordHash: credentials.hash, createdAt: new Date().toISOString() });
        saveData(USERS_KEY, users);
        $("signupForm").reset();
        showAuthTab("login");
        $("loginEmail").value = email;
        setAuthMessage("Cadastro criado! Agora entre com seu e-mail e senha.", true);
    } catch (error) {
        setAuthMessage("Falha ao criar o cadastro. Verifique o suporte a armazenamento seguro do navegador.");
    }
});

$("logoutButton").addEventListener("click", () => {
    currentUser = null;
    sessionStorage.removeItem(SESSION_KEY);
    document.body.classList.remove("authenticated", "role-user", "role-admin");
    $("authScreen").hidden = false;
    $("loginForm").reset();
    $("signupForm").reset();
    showAuthTab("login");
});

// Mantém a sessão após atualizar a página (até o usuário clicar em Sair).
try {
    const savedSession = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
    if (savedSession && ["Usuário", "Administrador"].includes(savedSession.role)) {
        // Para contas comuns, confirma que a conta ainda existe; para ADM, valida o e-mail reservado.
        const validUser = savedSession.role === "Usuário"
            ? getRegisteredUsers().some(item => item.email.toLowerCase() === String(savedSession.email).toLowerCase())
            : String(savedSession.email).toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase();
        if (validUser) enterApplication(savedSession, false);
        else sessionStorage.removeItem(SESSION_KEY);
    }
} catch (_) { sessionStorage.removeItem(SESSION_KEY); }

// Atualiza os dados/notificações em outras abas abertas no mesmo navegador.
function refreshSharedData(key) {
    if (["ajkf_residents", "ajkf_events", "ajkf_notifications", "ajkf_bulletins", APPOINTMENTS_KEY].includes(key)) {
        if (key === "ajkf_residents") residents = loadData("ajkf_residents", demoResidents);
        if (key === "ajkf_events") events = loadData("ajkf_events", demoEvents);
        if (key === "ajkf_notifications") notifications = loadData("ajkf_notifications", demoNotifications);
        if (key === "ajkf_bulletins") bulletins = loadData("ajkf_bulletins", demoBulletins);
        if (key === APPOINTMENTS_KEY) appointments = loadData(APPOINTMENTS_KEY, []);
        if (currentUser) {
            renderNotifications();
            renderDashboard();
            if (document.getElementById("page-residentes")?.classList.contains("active")) {
                if (currentUser.role === "Administrador") renderResidents();
                else if ($("residentLookupCode").value.trim()) {
                    const code = $("residentLookupCode").value.trim().toUpperCase();
                    renderResidentLookup(residents.find(item => String(item.code).toUpperCase() === code));
                }
            }
            if (document.getElementById("page-agenda")?.classList.contains("active") && currentUser.role === "Administrador") renderAppointmentRequests();
            if (document.getElementById("page-agendamento")?.classList.contains("active") && currentUser.role === "Usuário") renderMyAppointments();
            if (document.getElementById("page-comunicados")?.classList.contains("active")) renderBulletins();
        }
    } else if (key?.startsWith("ajkf_dismissed_notifications_")) {
        if (currentUser) renderNotifications();
    }
}
window.addEventListener("storage", event => { if (event.key) refreshSharedData(event.key); });
syncChannel?.addEventListener("message", event => refreshSharedData(event.data?.key));
