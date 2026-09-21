// صور_زوجين - أمر للحصول على صور عشوائية لزوجين (رجل + امرأة)

import config from '../../config.js'
import { downloadMediaMessage } from 'maro'
import fs from 'fs'
import { default as axios } from 'axios'
import te from '../../src/lib/maro-error.js'

const pluginConfig = {
    name: 'صور_زوجين',
    alias: ['ppcouple'],
    category: 'random',
    description: 'صور عشوائية لزوجين (رجل + امرأة)',
    usage: '.صور_زوجين',
    isGroup: true,
    isBotAdmin: false,
    isAdmin: false,
    cooldown: 10,
    energi: 2,
    isEnabled: true
};

async function handler(m, { sock }) {
   try {
        const res = await axios.get(`https://api.deline.web.id/random/ppcouple`)
        const data = res.data.result
        const cowo = data.cowo
        const cewe = data.cewe
        await sock.sendMessage(m.chat, {
            albumMessage: [
                {
                    image: { url: cowo },
                },
                {
                    image: { url: cewe },
                }
            ]
        }, { quoted: m })
   } catch (error) {
    m.reply(te(m.prefix, m.command, m.pushName))
   }
}

export { pluginConfig as config, handler }