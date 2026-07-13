/**
 * Componente de botão de alternância de filtros reutilizável (Power BI Style).
 * Encapsula a lógica de sincronização com o painel lateral de filtros.
 */
class FilterToggleButton extends HTMLElement {
    constructor() {
        super();
        this.btn = null;
        this.sidebar = null;
        this.sidebarCloseBtn = null;
        this.dashboard = null;
        this.onDocumentClick = this.handleDocumentClick.bind(this);
    }

    connectedCallback() {
        this.render();
        
        const init = () => {
            this.initElements();
            this.bindEvents();
        };

        if (document.readyState === "loading") {
            this.onDomLoaded = init;
            document.addEventListener("DOMContentLoaded", this.onDomLoaded);
        } else {
            init();
        }
    }

    disconnectedCallback() {
        document.removeEventListener("click", this.onDocumentClick);
        if (this.onDomLoaded) {
            document.removeEventListener("DOMContentLoaded", this.onDomLoaded);
        }
    }

    render() {
        // Limpa o conteúdo anterior de forma estritamente segura
        this.replaceChildren();

        // Cria o botão interno
        const button = document.createElement("button");
        button.className = "filter-toggle-btn";
        button.title = this.getAttribute("title") || "Filtros";

        // Cria o SVG Chevron
        const svgChevron = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgChevron.setAttribute("class", "filter-icon-chevron");
        svgChevron.setAttribute("viewBox", "0 0 24 24");

        const polyline1 = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
        polyline1.setAttribute("points", "11 17 5 12 11 7");
        svgChevron.appendChild(polyline1);

        const polyline2 = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
        polyline2.setAttribute("points", "18 17 12 12 18 7");
        svgChevron.appendChild(polyline2);

        // Cria o SVG Funnel
        const svgFunnel = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgFunnel.setAttribute("class", "filter-icon-funnel");
        svgFunnel.setAttribute("viewBox", "0 0 24 24");

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", "M3 4h18l-7 8v5l-4 2V12z");
        svgFunnel.appendChild(path);

        // Cria o Span de texto
        const textSpan = document.createElement("span");
        textSpan.className = "filter-toggle-text";
        textSpan.textContent = this.getAttribute("title") || "Filtros";

        // Adiciona todos ao botão
        button.appendChild(svgChevron);
        button.appendChild(svgFunnel);
        button.appendChild(textSpan);

        this.appendChild(button);
        this.btn = button;
    }

    initElements() {
        const sidebarSelector = this.getAttribute("target-sidebar");
        const sidebarCloseSelector = this.getAttribute("target-sidebar-close");
        const dashboardSelector = this.getAttribute("dashboard-container");

        if (sidebarSelector) {
            this.sidebar = document.querySelector(sidebarSelector);
        }
        if (sidebarCloseSelector) {
            this.sidebarCloseBtn = document.querySelector(sidebarCloseSelector);
        }
        if (dashboardSelector) {
            this.dashboard = document.querySelector(dashboardSelector);
        }
    }

    bindEvents() {
        if (this.btn) {
            this.btn.addEventListener("click", (e) => {
                e.stopPropagation();
                this.toggle();
            });
        }

        if (this.sidebarCloseBtn) {
            this.sidebarCloseBtn.addEventListener("click", () => {
                this.close();
            });
        }
    }

    toggle() {
        if (!this.sidebar) return;
        const isOpen = this.sidebar.classList.contains("open");
        if (isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        if (this.sidebar) {
            this.sidebar.classList.add("open");
        }
        if (this.dashboard) {
            this.dashboard.classList.add("sidebar-open");
        }
        this.classList.add("active");
        this.style.display = "none"; // Oculta o botão conforme layout original

        // Registra o evento global para escutar clique fora
        document.addEventListener("click", this.onDocumentClick);

        this.dispatchEvent(new CustomEvent("filter-open", { bubbles: true }));
    }

    close() {
        if (this.sidebar) {
            this.sidebar.classList.remove("open");
        }
        if (this.dashboard) {
            this.dashboard.classList.remove("sidebar-open");
        }
        this.classList.remove("active");
        this.style.display = "flex"; // Exibe novamente o botão

        // Remove o evento global para otimizar desempenho
        document.removeEventListener("click", this.onDocumentClick);

        this.dispatchEvent(new CustomEvent("filter-close", { bubbles: true }));
    }

    handleDocumentClick(e) {
        if (!this.sidebar) return;
        
        // Se a sidebar estiver aberta e o clique for fora da sidebar e fora do próprio botão de toggle
        const clickedInsideSidebar = this.sidebar.contains(e.target);
        const clickedInsideToggle = this.contains(e.target);

        if (!clickedInsideSidebar && !clickedInsideToggle) {
            this.close();
        }
    }
}

customElements.define("filter-toggle-button", FilterToggleButton);
