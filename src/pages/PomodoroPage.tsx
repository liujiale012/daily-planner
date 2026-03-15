import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

const WORK_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function PomodoroPage() {
  const [secondsLeft, setSecondsLeft] = useState(WORK_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsBreak((b) => {
            if (b) toast.success('休息结束，继续专注吧');
            else toast.success('专注时间到，休息一下吧');
            return !b;
          });
          return !isBreak ? BREAK_SECONDS : WORK_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, isBreak]);

  const handleReset = () => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSecondsLeft(isBreak ? BREAK_SECONDS : WORK_SECONDS);
  };

  const handleSwitchMode = () => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsBreak((b) => !b);
    setSecondsLeft(!isBreak ? BREAK_SECONDS : WORK_SECONDS);
  };

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {isBreak ? '休息时间' : '专注时间'}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <p className="text-5xl font-mono font-bold tabular-nums text-gray-900 dark:text-gray-100">
            {formatTime(secondsLeft)}
          </p>
          <div className="flex gap-2">
            <Button
              size="lg"
              onClick={() => setIsRunning((r) => !r)}
              aria-label={isRunning ? '暂停' : '开始'}
            >
              {isRunning ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>
            <Button variant="outline" size="lg" onClick={handleReset} aria-label="重置">
              <RotateCcw className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="lg" onClick={handleSwitchMode}>
              {isBreak ? '切回专注' : '休息一下'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
