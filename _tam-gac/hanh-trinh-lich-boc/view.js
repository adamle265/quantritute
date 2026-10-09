    journey() {
      return { title: 'Hành trình · Quản trị tử tế', html: `${notice()}${subHead('/hanh-trinh')}<main class="wrap"><div class="lb-intro">
        <p class="mono">Hành trình</p><h1 class="page-title">Mỗi ngày một tờ lịch</h1>
        <p class="hand lb-lead">Mỗi ngày làm 1 công cụ, mỗi ngày giải quyết 1 vấn đề.</p></div>
        <div class="lb" id="lb"><div class="loading">Đang tải…</div></div></main>${footer()}`,
        after: async () => {
          const box = $('#lb');
          try {
            const d = await api('episodes'), eps = d.episodes || [];
            eps.sort((a, b) => String(b.publish_date || '').localeCompare(String(a.publish_date || '')) || dayNoOf(b) - dayNoOf(a) || b.id - a.id);
            journeyCal(box, eps, d.next || null);
          } catch (e) { box.innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
        } };
    },
