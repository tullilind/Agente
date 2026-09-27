import SwiftUI
import Charts

// Referências de implementação. Use APIs nativas e ajuste ao produto real.

struct AdaptiveNavigationExample: View {
    var body: some View {
        NavigationSplitView {
            List {
                NavigationLink("Visão geral", value: "overview")
                NavigationLink("Itens", value: "items")
                NavigationLink("Relatórios", value: "reports")
            }
            .navigationTitle("Produto")
        } detail: {
            ContentUnavailableView(
                "Selecione uma área",
                systemImage: "sidebar.left",
                description: Text("Escolha um item na navegação.")
            )
        }
    }
}

struct SearchableListExample: View {
    @State private var query = ""
    let items = ["Alpha", "Beta", "Gamma"]

    var filteredItems: [String] {
        query.isEmpty ? items : items.filter {
            $0.localizedCaseInsensitiveContains(query)
        }
    }

    var body: some View {
        NavigationStack {
            List(filteredItems, id: \.self) { item in
                Text(item)
            }
            .navigationTitle("Itens")
            .searchable(text: $query, prompt: "Pesquisar")
        }
    }
}

struct SettingsExample: View {
    @State private var enabled = true
    @State private var mode = 0

    var body: some View {
        NavigationStack {
            Form {
                Section("Geral") {
                    Toggle("Sincronização", isOn: $enabled)
                    Picker("Modo", selection: $mode) {
                        Text("Automático").tag(0)
                        Text("Manual").tag(1)
                    }
                }
            }
            .navigationTitle("Configurações")
        }
    }
}

struct ChartExample: View {
    let values: [(String, Double)] = [
        ("Seg", 12), ("Ter", 18), ("Qua", 15), ("Qui", 24)
    ]

    var body: some View {
        Chart(values, id: \.0) { item in
            BarMark(
                x: .value("Dia", item.0),
                y: .value("Valor", item.1)
            )
        }
        .accessibilityLabel("Valores por dia")
    }
}
