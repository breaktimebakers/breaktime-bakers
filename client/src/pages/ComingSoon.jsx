import { ArrowDownRight, Heart, Sparkles, Wheat } from 'lucide-react'
import './ComingSoon.css'

function BreadIllustration() {
  return (
    <svg className="coming-soon__bread" viewBox="0 0 560 480" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="bread-crust" x1="280" y1="170" x2="280" y2="395" gradientUnits="userSpaceOnUse">
          <stop stopColor="#EDB66B" /><stop offset=".55" stopColor="#CC793C" /><stop offset="1" stopColor="#9F492A" />
        </linearGradient>
        <linearGradient id="bread-score"><stop stopColor="#FFF0CC" /><stop offset="1" stopColor="#E8AA62" /></linearGradient>
      </defs>
      <ellipse cx="283" cy="397" rx="202" ry="29" fill="#663E2B" opacity=".1" />
      <ellipse cx="280" cy="380" rx="219" ry="29" fill="#E9D9BA" />
      <ellipse cx="280" cy="375" rx="204" ry="22" stroke="#C7AE83" strokeWidth="1.5" />
      <path d="M83 332C83 233 153 175 262 170C367 164 454 220 468 316C481 378 420 390 280 390C161 390 81 381 83 332Z" fill="url(#bread-crust)" />
      <path d="M95 344C168 373 382 378 460 339" stroke="#A6512D" strokeWidth="5" strokeLinecap="round" opacity=".55" />
      <g fill="url(#bread-score)">
        <path d="M185 196C150 226 137 270 151 302C174 286 193 251 204 189Z" />
        <path d="M262 181C223 207 203 254 216 302C248 276 272 234 280 180Z" />
        <path d="M334 186C299 209 278 253 288 302C320 280 344 240 349 190Z" />
        <path d="M393 211C363 231 345 264 351 302C379 287 398 258 405 222Z" />
      </g>
      <g fill="#FFE4B0" opacity=".6">
        {[[119,316],[177,328],[243,338],[317,333],[401,317],[435,330],[127,287],[192,307],[275,316],[372,340],[222,204],[302,201],[417,279]].map(([cx, cy]) => (
          <ellipse key={`${cx}-${cy}`} cx={cx} cy={cy} rx="2" ry="1.4" />
        ))}
      </g>
      <g stroke="#A66B48" strokeWidth="3" strokeLinecap="round" opacity=".45">
        <path className="coming-soon__steam" d="M220 144C198 125 244 112 223 84C215 73 216 67 222 58" />
        <path className="coming-soon__steam" d="M280 133C258 114 304 101 283 73C275 62 276 56 282 47" />
        <path className="coming-soon__steam" d="M340 145C318 126 364 113 343 85C335 74 336 68 342 59" />
      </g>
    </svg>
  )
}

export default function ComingSoon() {
  return (
    <div className="coming-soon">
      <header className="coming-soon__header">
        <a className="coming-soon__brand" href="/" aria-label="Break Time Bakers home">
          <img src="/breakTimeLogo.png" alt="" width="56" height="56" />
          <span>Break Time<span>B A K E R S</span></span>
        </a>
        <span className="coming-soon__status"><span /> A little goodness is on its way</span>
      </header>
      <main className="coming-soon__main">
        <section className="coming-soon__copy" aria-labelledby="coming-soon-title">
          <p className="coming-soon__eyebrow"><span /> GOOD THINGS TAKE A LITTLE TIME</p>
          <h1 id="coming-soon-title">Something<br />good is <em>baking.</em></h1>
          <p className="coming-soon__description">A fresh little corner of the internet, made for your favorite break. We’re putting the finishing touches on something delicious.</p>
          <div className="coming-soon__launch"><span>Coming soon</span><ArrowDownRight size={23} strokeWidth={1.5} aria-hidden="true" /></div>
          <p className="coming-soon__note">A little patience. A lot of butter.</p>
        </section>
        <div className="coming-soon__art" aria-hidden="true">
          <div className="coming-soon__arch" />
          <div className="coming-soon__seal"><Wheat size={25} strokeWidth={1.2} /><span>WORTH<br />THE WAIT</span><span>✦</span></div>
          <Sparkles className="coming-soon__sparkle coming-soon__sparkle--one" size={31} strokeWidth={1} />
          <Sparkles className="coming-soon__sparkle coming-soon__sparkle--two" size={22} strokeWidth={1} />
          <BreadIllustration />
          <div className="coming-soon__art-caption"><span /> fresh out of our imagination <span /></div>
          <p className="coming-soon__handwritten">Your next happy break.</p>
        </div>
      </main>
      <div className="coming-soon__ribbon" aria-hidden="true">
        <span>FRESH IDEAS</span><span>✳</span><span>WARM MOMENTS</span><span>✳</span><span>HAPPY BREAKS</span><span>✳</span><span>BAKED WITH LOVE</span>
      </div>
      <footer className="coming-soon__footer">
        <span>© {new Date().getFullYear()} Break Time Bakers</span>
        <span>Made with a little <Heart size={13} aria-label="love" /> and a lot of dough.</span>
      </footer>
    </div>
  )
}
