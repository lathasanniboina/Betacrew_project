// const net = require('net');
// const fs = require('fs');

// const client = new net.Socket();
// const output = [];

// client.connect(3000, '127.0.0.1', () => {
//     console.log('Connected to server');
// });

// client.on('data', (data) => {
//     console.log('Received: ' + data);
//     const packet = parsePacket(data);
//     output.push(packet);
//     if (packet.packetSequence < output.length) {
//         client.write(Buffer.from([packet.packetSequence]));
//         console.log('Requested missing packet sequence:', packet.packetSequence);
//     }
// });

// client.on('close', () => {
//     console.log('Connection closed');
//     fs.writeFileSync('output.json', JSON.stringify(output, null, 2));
//     console.log('Output saved to output.json');
// });

// function parsePacket(data) {
//     return {
//         symbol: data.slice(0, 4).toString('ascii'),
//         buysellindicator: data.slice(4, 5).toString('ascii'),
//         quantity: data.readInt32BE(5),
//         price: data.readInt32BE(9),
//         packetSequence: data.readInt32BE(13),
//     };
// }






const axios = require('axios');
const fs = require('fs');

const output = [];
let expectedSequence = 1;

async function fetchData() {
    try {
        const response = await axios.get('http://localhost:3000/data');
        const packet = response.data;
        
        // Add the packet to the output array
        output.push(packet);

        // Check if the packet sequence is as expected
        while (packet.packetSequence !== expectedSequence) {
            try {
                // Request the missing packet
                const missingPacketResponse = await axios.get(`http://localhost:3000/data/${expectedSequence}`);
                const missingPacket = missingPacketResponse.data;
                
                // Add the missing packet to the output array
                output.push(missingPacket);
                expectedSequence++;
            } catch (missingPacketError) {
                console.error(`Error fetching missing packet with sequence ${expectedSequence}:`, missingPacketError.message);
                return;
            }
        }

        // Increment the expected sequence
        expectedSequence++;

        // Fetch the next packet
        fetchData();
    } catch (error) {
        if (error.response && error.response.status === 204) {
            // No more data to fetch
            console.log('No more data to fetch');
            fs.writeFileSync('output.json', JSON.stringify(output, null, 2));
            console.log('Output saved to output.json');
        } else {
            console.error('Error fetching data:', error.message);
        }
    }
}

fetchData();



