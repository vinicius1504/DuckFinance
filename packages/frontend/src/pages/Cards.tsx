import { Card } from '../components/ui/Card.js';
import { Sparkles } from 'lucide-react';

export function CardsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">Em breve</h1>
      <Card className="text-center py-12">
        <Sparkles size={48} className="mx-auto mb-4 text-[var(--text-muted)]" />
        <p className="text-[var(--text-muted)]">Nova funcionalidade em desenvolvimento</p>
      </Card>
    </div>
  );
}
