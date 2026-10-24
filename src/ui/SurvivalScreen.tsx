import { gateUrl } from '../art/buildings';
import { survivalCoins } from '../game/survival';
import type { SaveData } from '../game/types';
import { QPanel, QuarterScene } from './QuarterScene';

const SAMPLE_WAVES = 10;
const MINI_BOSS_EVERY = 5;

export function SurvivalScreen({ save, onBack, onStart }: { save: SaveData; onBack: () => void; onStart: () => void }) {
  return (
    <div className="survival qscreen">
      <QuarterScene
        quarter="arena"
        title="Survival Gate"
        art={gateUrl()}
        onBack={onBack}
        line="Endless waves, each stronger than the last. No healing between waves: HP, Ki and special bars carry over."
        status={{ label: 'Best run', value: `Wave ${save.survivalBest}` }}
      />
      <QPanel eyebrow="THE ENDLESS GATE" title="Hold the line" aside={<span className="qtag">BEST {save.survivalBest}</span>}>
        <div className="qstats">
          <span className="qstat"><small>Mini-boss</small><b>Every {MINI_BOSS_EVERY}th wave</b></span>
          <span className="qstat"><small>{SAMPLE_WAVES} waves pay</small><b>● {survivalCoins(SAMPLE_WAVES).toLocaleString()}</b></span>
          <span className="qstat"><small>Bonus</small><b>1 Spin Orb / {MINI_BOSS_EVERY} waves</b></span>
        </div>
        <p>When your team falls, you are paid for every wave cleared.</p>
        <button className="btn primary big" onClick={onStart}>
          Enter the Gate
        </button>
      </QPanel>
    </div>
  );
}
