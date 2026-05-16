const ROLE_IMAGES = {
  werewolf: 'https://bizweb.dktcdn.net/100/316/286/files/werewolf.jpg?v=1671683859160',
  minion: 'https://bizweb.dktcdn.net/100/316/286/files/minion.jpg?v=1671683858697',
  seer: 'https://bizweb.dktcdn.net/100/316/286/files/seer.jpg?v=1671683857717',
  robber: 'https://bizweb.dktcdn.net/100/316/286/files/robber.jpg?v=1671683857100',
  troublemaker: 'https://bizweb.dktcdn.net/100/316/286/files/troublemaker.jpg?v=1671683856507',
  drunk: 'https://bizweb.dktcdn.net/100/316/286/files/drunk.jpg?v=1671683856133',
  insomniac: 'https://bizweb.dktcdn.net/100/316/286/files/insomniac.jpg?v=1671683855693',
  villager: 'https://bizweb.dktcdn.net/100/316/286/files/villager.jpg?v=1671683855300',
  hunter: 'https://bizweb.dktcdn.net/100/316/286/files/hunter.jpg?v=1671683853690',
  tanner: 'https://bizweb.dktcdn.net/100/316/286/files/tanner.jpg?v=1671683854923',
  mason: 'https://bizweb.dktcdn.net/100/316/286/files/mason.jpg',
  sentinel: 'https://www.ultraboardgames.com/one-night-ultimate-werewolf/gfx/daybreak2.jpg',
  alphawolf: 'https://www.ultraboardgames.com/one-night-ultimate-werewolf/gfx/daybreak1.jpg',
  mysticwolf: 'https://www.ultraboardgames.com/one-night-ultimate-werewolf/gfx/daybreak3.jpg',
  dreamwolf: 'https://www.ultraboardgames.com/one-night-ultimate-werewolf/gfx/daybreak9.jpg',
  apprenticeseer: 'https://file.hstatic.net/1000019936/file/1_dac753b4164d43ff82fb6a75c4de17eb_grande.jpg',
  paranormalinvestigator: 'https://www.ultraboardgames.com/one-night-ultimate-werewolf/gfx/daybreak4.jpg',
  witch: 'https://www.ultraboardgames.com/one-night-ultimate-werewolf/gfx/daybreak5.jpg',
  villageidiot: 'https://www.ultraboardgames.com/one-night-ultimate-werewolf/gfx/daybreak6.jpg',
  revealer: 'https://www.ultraboardgames.com/one-night-ultimate-werewolf/gfx/daybreak7.jpg',
  bodyguard: 'https://www.ultraboardgames.com/one-night-ultimate-werewolf/gfx/daybreak9_.jpg',
};

export default function RoleIcon({ roleId, size = 80, className = '' }) {
  const src = ROLE_IMAGES[roleId];
  if (!src) return <div className={`text-4xl ${className}`}>🃏</div>;

  return (
    <img
      src={src}
      alt={roleId}
      className={`rounded-full object-cover ${className}`}
      style={{ width: size, height: size }}
      draggable={false}
    />
  );
}
