// components/MemberList.tsx
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";

export const MemberList = ({ members }: { members: any[] }) => (
  <div className="space-y-4">
    <Input className="bg-white/10 border-white/20 h-12 rounded-2xl" placeholder="Search name..." />
    <ScrollArea className="h-[400px]">
      {members.map((m) => (
        <div key={m.id} className="flex items-center justify-between p-4 mb-2 bg-white/5 rounded-2xl border border-white/10">
          <div>
            <p className="font-bold">{m.name}</p>
            <Badge variant="outline" className="text-[10px] opacity-50">{m.cell}</Badge>
          </div>
          <Button className="rounded-full bg-white text-black hover:bg-pearl-gold">Present</Button>
        </div>
      ))}
    </ScrollArea>
  </div>
);