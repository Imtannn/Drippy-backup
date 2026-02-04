type PoseItem = {
	thumbnail: string
	name: string
	value: string
}

type AnimationItem = {
	thumbnail: string
	name: string
	value: string
	src: string | null
	type: 'none' | 'walk' | 'dance' | 'idle'
	clipName: string | null
}

export const poses = {
	female: [
		{
			thumbnail: '/images/avatars/poses/Standing01.png',
			name: 'Standing 01',
			value: 'standing01',
		},
		{
			thumbnail: '/images/avatars/poses/Standing02.png',
			name: 'Standing 02',
			value: 'standing02',
		},
		{
			thumbnail: '/images/avatars/poses/Standing03.png',
			name: 'Standing 03',
			value: 'standing03',
		},
		{
			thumbnail: '/images/avatars/poses/Standing04.png',
			name: 'Standing 04',
			value: 'standing04',
		},
	] as PoseItem[],
	male: [] as PoseItem[],
}

export const animations = {
	female: [
		{
			thumbnail: '/images/avatars/animations/Idle01.png',
			name: 'Idle 01',
			value: 'idle01',
			src: '/models/Idle01.glb',
			type: 'idle',
			clipName: 'Animation',
		},
		{
			thumbnail: '/images/avatars/animations/Idle02.png',
			name: 'Idle 02',
			value: 'idle02',
			src: '/models/Idle_F02.glb',
			type: 'idle',
			clipName: 'Animation',
		},
		{
			thumbnail: '/images/avatars/animations/Idle03.png',
			name: 'Idle 03',
			value: 'idle03',
			src: '/models/Idle_F03.glb',
			type: 'idle',
			clipName: 'Animation',
		},
		{
			thumbnail: '/images/avatars/animations/Idle04.png',
			name: 'Idle 04',
			value: 'idle04',
			src: '/models/Idle_F04.glb',
			type: 'idle',
			clipName: 'Animation',
		},
	] as AnimationItem[],
	male: [] as AnimationItem[],
}
