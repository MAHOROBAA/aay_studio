import { parseCliArgs, setBetaTesterStatus } from './lib'

async function main() {
  const args = parseCliArgs({
    email: { required: true },
    reason: { required: true },
  })

  const result = await setBetaTesterStatus(args.email!, 'disabled', args.reason!)
  console.log('비활성화 완료:')
  console.log(result)
}

void main().catch((error: Error) => {
  console.error(error.message)
  process.exit(1)
})
