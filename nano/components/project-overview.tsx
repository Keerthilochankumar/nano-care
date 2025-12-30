import NextLink from "next/link";
import { Stethoscope, Brain, Activity } from "lucide-react";

export const ProjectOverview = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
          <Stethoscope className="w-8 h-8 text-white" />
        </div>
        <div className="text-left">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            HealthRAG AI Assistant
          </h1>
          <p className="text-muted-foreground">Intelligent Healthcare Support</p>
        </div>
      </div>
      
      <div className="text-center max-w-2xl space-y-4">
        <p className="text-lg text-muted-foreground leading-relaxed">
          Your AI-powered healthcare assistant combining advanced language models with 
          retrieval-augmented generation for accurate, evidence-based medical insights.
        </p>
        
        <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <Brain className="w-4 h-4 text-blue-500" />
            <span>AI-Powered</span>
          </div>
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-green-500" />
            <span>Real-time</span>
          </div>
          <div className="flex items-center space-x-2">
            <Stethoscope className="w-4 h-4 text-purple-500" />
            <span>Medical Grade</span>
          </div>
        </div>
      </div>
      
      <div className="text-center text-sm text-muted-foreground">
        <p>
          Powered by <Link href="https://groq.com/">Groq</Link> and the{" "}
          <Link href="https://sdk.vercel.ai/docs">Vercel AI SDK</Link>
        </p>
      </div>
    </div>
  );
};

const Link = ({
  children,
  href,
}: {
  children: React.ReactNode;
  href: string;
}) => {
  return (
    <NextLink
      target="_blank"
      className="text-blue-500 hover:text-blue-600 transition-colors duration-75 underline"
      href={href}
    >
      {children}
    </NextLink>
  );
};
