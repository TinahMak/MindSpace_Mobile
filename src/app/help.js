import HelpScreen from '../components/HelpScreen';

// Reachable from every screen (and while logged out) via "Get help now".
export default function HelpModal() {
  return <HelpScreen asModal />;
}
