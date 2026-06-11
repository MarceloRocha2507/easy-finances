import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Tags, Users, Building2, Shield, Settings, Wrench } from "lucide-react";

const utilities = [
  {
    title: "Categorias",
    description: "Gerencie as categorias de receitas e despesas",
    icon: Tags,
    href: "/categories",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    title: "Responsáveis",
    description: "Cadastre pessoas responsáveis por compras no cartão",
    icon: Users,
    href: "/responsaveis",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    title: "Bancos",
    description: "Gerencie as instituições financeiras",
    icon: Building2,
    href: "/cartoes/bancos",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    title: "Configurações",
    description: "Ajuste as preferências do seu perfil",
    icon: Settings,
    href: "/profile/preferencias",
    color: "text-slate-500",
    bgColor: "bg-slate-500/10",
  },
];

export default function Utilitarios() {
  return (
    <Layout>
      <div className="container mx-auto p-4 max-w-5xl space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Utilitários</h1>
          <p className="text-muted-foreground">
            Acesse ferramentas e configurações para personalizar sua experiência.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {utilities.map((item) => (
            <Link key={item.href} to={item.href}>
              <Card className="hover:border-primary/50 transition-all duration-200 cursor-pointer group h-full">
                <CardHeader className="flex flex-row items-center space-x-4 pb-2">
                  <div className={`p-2.5 rounded-xl ${item.bgColor} ${item.color} group-hover:scale-110 transition-transform duration-200`}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    Acessar ferramenta
                    <Wrench className="ml-2 h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
}
